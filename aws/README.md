# AWS Deployment Architecture Guide

This guide explains how to transition this NestJS + Docker setup from local Docker Compose to a production-grade AWS infrastructure.

---

## 1. Local vs. AWS Architecture Mapping

| Component | Local Docker Compose | AWS Production Equivalent |
|---|---|---|
| **API Container** | `api` (NestJS development / production stage) | **AWS ECS (Elastic Container Service) on AWS Fargate** or **AWS App Runner** |
| **Container Registry** | Local Docker Daemon cache | **Amazon ECR (Elastic Container Registry)** |
| **Reverse Proxy** | `nginx` container (Port 80/443) | **Application Load Balancer (ALB)** + **AWS Certificate Manager (ACM)** for SSL |
| **Relational DB** | `postgres:16-alpine` container | **Amazon RDS for PostgreSQL** (Multi-AZ, automated backups) |
| **Document DB** | `mongo:7.0` container | **Amazon DocumentDB** (MongoDB-compatible) or **MongoDB Atlas on AWS** |
| **In-Memory Cache**| `redis:7-alpine` container | **Amazon ElastiCache for Redis / Valkey** |
| **Secret Management**| `.env` file | **AWS Secrets Manager** & **AWS Systems Manager Parameter Store** |
| **Logging & Metrics**| `docker compose logs` | **Amazon CloudWatch Logs & Metrics** |

---

## 2. Architecture Diagram (Mermaid)

```mermaid
flowchart TD
    subgraph Internet
        User([Client / Browser / Mobile])
    end

    subgraph AWS Cloud (VPC)
        subgraph Public Subnets
            ALB[Application Load Balancer / ACM HTTPS]
            NAT[NAT Gateway]
        end

        subgraph Private Application Subnets
            subgraph ECS Cluster [Amazon ECS Fargate]
                Task1[NestJS Container 1]
                Task2[NestJS Container 2]
            end
        end

        subgraph Private Database Subnets
            RDS[(Amazon RDS PostgreSQL\nMulti-AZ)]
            DocDB[(Amazon DocumentDB / MongoDB Atlas)]
            ElastiCache[(Amazon ElastiCache Redis)]
        end

        subgraph Management & Security
            SM[AWS Secrets Manager]
            ECR[Amazon ECR Image Registry]
            CW[CloudWatch Logs & Metrics]
        end
    end

    User -->|HTTPS :443| ALB
    ALB -->|HTTP :3000| Task1
    ALB -->|HTTP :3000| Task2

    Task1 --> RDS
    Task1 --> DocDB
    Task1 --> ElastiCache

    Task2 --> RDS
    Task2 --> DocDB
    Task2 --> ElastiCache

    Task1 -.->|Fetch Secrets| SM
    Task2 -.->|Fetch Secrets| SM
    Task1 -.->|Ship Logs| CW
    Task2 -.->|Ship Logs| CW

    ECR -.->|Pull Image| Task1
    ECR -.->|Pull Image| Task2
```

---

## 3. Step-by-Step AWS Deployment Workflow

### Step 1: Create an ECR Repository
```bash
aws ecr create-repository \
  --repository-name nest-docker-api \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1
```

### Step 2: Build and Push Multi-Stage Image
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build targeting 'production' stage
docker build --target production -t nest-docker-api:latest .

# Tag for ECR
docker tag nest-docker-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nest-docker-api:latest

# Push
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nest-docker-api:latest
```

### Step 3: Store Sensitive Credentials in AWS Secrets Manager
```bash
# Store PostgreSQL credentials
aws secretsmanager create-secret \
  --name nest-docker/db-credentials \
  --secret-string '{"username":"app_user","password":"RDS_SECURE_PASSWORD"}'

# Store Mongo URI
aws secretsmanager create-secret \
  --name nest-docker/mongo-uri \
  --secret-string 'mongodb://user:password@docdb-cluster.us-east-1.docdb.amazonaws.com:27017/nest_mongo_db?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false'

# Store Redis Auth
aws secretsmanager create-secret \
  --name nest-docker/redis-auth \
  --secret-string 'ELASTICACHE_AUTH_TOKEN'
```

### Step 4: Register the ECS Task Definition
```bash
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
```

### Step 5: Create or Update the ECS Service
```bash
aws ecs update-service \
  --cluster production-cluster \
  --service nest-api-service \
  --task-definition nest-docker-api-task \
  --force-new-deployment
```

---

## 4. Why Nginx is Optional on AWS ECS
In local development and on standard virtual servers (EC2, VPS, DigitalOcean), Nginx handles:
1. SSL termination (Let's Encrypt / Certbot).
2. Rate limiting.
3. Upstream proxying and static asset caching.

On AWS, **AWS Application Load Balancer (ALB)** and **AWS CloudFront** natively handle SSL termination and DDoS protection via AWS WAF. However, keeping the `nginx` container definition in this template allows you to:
- Deploy to any VPS (DigitalOcean, Linode, AWS EC2 with Docker Compose) without requiring expensive managed load balancers.
- Test production-grade reverse proxying and rate limiting directly on your local machine.

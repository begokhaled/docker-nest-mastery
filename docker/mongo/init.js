// =============================================================================
// MongoDB Initialization Script
// Executed by /docker-entrypoint-initdb.d/init.js when MongoDB container initializes
// =============================================================================

const dbName = 'nest_mongo_db';
const dbInstance = db.getSiblingDB(dbName);

print(`Creating collection and indexes for ${dbName}...`);

// Ensure audit_logs collection exists
dbInstance.createCollection('audit_logs');

// Create indexes
dbInstance.audit_logs.createIndex({ createdAt: -1 });
dbInstance.audit_logs.createIndex({ level: 1 });

// Seed an initial document
dbInstance.audit_logs.insertOne({
  action: 'SYSTEM_INIT',
  level: 'INFO',
  details: 'MongoDB container initialized with seed collection',
  metadata: {
    initializedBy: 'docker-entrypoint',
    environment: 'development'
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization script completed successfully.');

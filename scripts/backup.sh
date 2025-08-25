#!/bin/bash

# Database backup script for BookCritic application
# This script creates a backup of the PostgreSQL database and uploads it to AWS S3

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Set variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="../backups"
BACKUP_FILE="${BACKUP_DIR}/bookcritic_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting database backup at $(date)" | tee -a ${LOG_FILE}

# Create database backup
PGPASSWORD=${DB_PASSWORD} pg_dump \
  -h ${DB_HOST} \
  -p ${DB_PORT} \
  -U ${DB_USERNAME} \
  -d ${DB_DATABASE} \
  -F c \
  | gzip > ${BACKUP_FILE}

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Database backup completed successfully: ${BACKUP_FILE}" | tee -a ${LOG_FILE}
  
  # Upload to S3 if AWS credentials are provided
  if [ ! -z "${AWS_S3_BUCKET}" ] && [ ! -z "${AWS_ACCESS_KEY_ID}" ] && [ ! -z "${AWS_SECRET_ACCESS_KEY}" ]; then
    echo "Uploading backup to AWS S3..." | tee -a ${LOG_FILE}
    
    # Upload to S3
    aws s3 cp ${BACKUP_FILE} s3://${AWS_S3_BUCKET}/backups/$(basename ${BACKUP_FILE}) \
      --region ${AWS_REGION} \
      --quiet
    
    # Check if upload was successful
    if [ $? -eq 0 ]; then
      echo "Backup uploaded to S3 successfully" | tee -a ${LOG_FILE}
    else
      echo "Error: Failed to upload backup to S3" | tee -a ${LOG_FILE}
    fi
  else
    echo "AWS credentials not found. Skipping S3 upload." | tee -a ${LOG_FILE}
  fi
  
  # Cleanup old backups (keep last 7 days)
  echo "Cleaning up old backups..." | tee -a ${LOG_FILE}
  find ${BACKUP_DIR} -name "bookcritic_*.sql.gz" -type f -mtime +7 -delete
  
  echo "Backup process completed at $(date)" | tee -a ${LOG_FILE}
else
  echo "Error: Database backup failed" | tee -a ${LOG_FILE}
  exit 1
fi

#!/bin/bash

# Database restore script for BookCritic application
# This script restores a PostgreSQL database from a backup file

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Error: Backup file not specified"
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE=$1
LOG_FILE="../backups/restore_$(date +"%Y%m%d_%H%M%S").log"

# Check if backup file exists
if [ ! -f ${BACKUP_FILE} ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Starting database restore at $(date)" | tee -a ${LOG_FILE}
echo "Backup file: ${BACKUP_FILE}" | tee -a ${LOG_FILE}

# Confirm before proceeding
read -p "This will overwrite the current database. Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled" | tee -a ${LOG_FILE}
  exit 1
fi

# Restore database
echo "Restoring database..." | tee -a ${LOG_FILE}

# Check if the backup is compressed
if [[ ${BACKUP_FILE} == *.gz ]]; then
  # Decompress and restore
  gunzip -c ${BACKUP_FILE} | PGPASSWORD=${DB_PASSWORD} pg_restore \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USERNAME} \
    -d ${DB_DATABASE} \
    -c \
    -v
else
  # Restore directly
  PGPASSWORD=${DB_PASSWORD} pg_restore \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USERNAME} \
    -d ${DB_DATABASE} \
    -c \
    -v \
    ${BACKUP_FILE}
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
  echo "Database restore completed successfully at $(date)" | tee -a ${LOG_FILE}
else
  echo "Error: Database restore failed at $(date)" | tee -a ${LOG_FILE}
  exit 1
fi

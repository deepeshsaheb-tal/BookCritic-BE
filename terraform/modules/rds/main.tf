resource "aws_db_subnet_group" "main" {
  name       = "bookcritic-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "BookCritic DB Subnet Group"
  }
}

resource "aws_db_parameter_group" "main" {
  name   = "bookcritic-postgres-params"
  family = "postgres14"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name = "BookCritic PostgreSQL Parameter Group"
  }
}

resource "aws_security_group" "db" {
  name        = "bookcritic-db-sg"
  description = "Security group for BookCritic RDS instance"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "BookCritic DB Security Group"
  }
}

resource "aws_db_instance" "main" {
  identifier             = "bookcritic-db"
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "14.12"
  instance_class         = var.db_instance_class
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = aws_db_parameter_group.main.name
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  multi_az               = false
  storage_encrypted      = true
  deletion_protection    = false
  apply_immediately      = true
  auto_minor_version_upgrade = true

  tags = {
    Name = "BookCritic PostgreSQL Database"
  }
}

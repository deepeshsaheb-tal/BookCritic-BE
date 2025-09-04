import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1757005885468 implements MigrationInterface {
    name = 'InitialMigration1757005885468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create extension for UUID generation
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        
        // Create tables
        await queryRunner.query(`CREATE TABLE "genres" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "name" character varying NOT NULL, 
            "description" character varying, 
            CONSTRAINT "UQ_genres_name" UNIQUE ("name"), 
            CONSTRAINT "PK_genres" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`CREATE TABLE "books" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "title" character varying NOT NULL, 
            "author" character varying NOT NULL, 
            "isbn" character varying, 
            "description" text, 
            "published_date" date, 
            "cover_image_url" character varying, 
            CONSTRAINT "UQ_books_isbn" UNIQUE ("isbn"), 
            CONSTRAINT "PK_books" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "email" character varying NOT NULL, 
            "display_name" character varying NOT NULL, 
            "password_hash" character varying NOT NULL, 
            "last_login" TIMESTAMP, 
            "role" character varying NOT NULL DEFAULT 'user', 
            CONSTRAINT "UQ_users_email" UNIQUE ("email"), 
            CONSTRAINT "PK_users" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`CREATE TABLE "book_genres" (
            "book_id" uuid NOT NULL, 
            "genre_id" uuid NOT NULL, 
            CONSTRAINT "PK_book_genres" PRIMARY KEY ("book_id", "genre_id")
        )`);
        
        await queryRunner.query(`CREATE TABLE "user_favorites" (
            "user_id" uuid NOT NULL, 
            "book_id" uuid NOT NULL, 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id")
        )`);
        
        await queryRunner.query(`CREATE TABLE "reviews" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "user_id" uuid NOT NULL, 
            "book_id" uuid NOT NULL, 
            "rating" integer NOT NULL, 
            "content" text NOT NULL, 
            CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
        )`);
        
        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_books_title" ON "books" ("title")`);
        await queryRunner.query(`CREATE INDEX "IDX_books_author" ON "books" ("author")`);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_rating" ON "reviews" ("rating")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_favorites_user_id" ON "user_favorites" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_favorites_book_id" ON "user_favorites" ("book_id")`);
        
        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "book_genres" ADD CONSTRAINT "FK_book_genres_books" 
            FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "book_genres" ADD CONSTRAINT "FK_book_genres_genres" 
            FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_users" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_books" 
            FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_users" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_books" 
            FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_books"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_users"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_user_favorites_books"`);
        await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_user_favorites_users"`);
        await queryRunner.query(`ALTER TABLE "book_genres" DROP CONSTRAINT "FK_book_genres_genres"`);
        await queryRunner.query(`ALTER TABLE "book_genres" DROP CONSTRAINT "FK_book_genres_books"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_user_favorites_book_id"`);
        await queryRunner.query(`DROP INDEX "IDX_user_favorites_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_reviews_rating"`);
        await queryRunner.query(`DROP INDEX "IDX_books_author"`);
        await queryRunner.query(`DROP INDEX "IDX_books_title"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "user_favorites"`);
        await queryRunner.query(`DROP TABLE "book_genres"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "genres"`);
    }
}

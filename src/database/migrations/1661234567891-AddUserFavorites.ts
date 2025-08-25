import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add user_favorites table
 */
export class AddUserFavorites1661234567891 implements MigrationInterface {
  name = 'AddUserFavorites1661234567891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_favorites table
    await queryRunner.query(`
      CREATE TABLE "user_favorites" (
        "user_id" uuid NOT NULL,
        "book_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_favorites" PRIMARY KEY ("user_id", "book_id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_users"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_user_favorites_books"
      FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_user_favorites_user_id" ON "user_favorites" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_favorites_book_id" ON "user_favorites" ("book_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_user_favorites_book_id"`);
    await queryRunner.query(`DROP INDEX "IDX_user_favorites_user_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_user_favorites_books"`);
    await queryRunner.query(`ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_user_favorites_users"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "user_favorites"`);
  }
}

-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
-- -----------------------------------------------------
-- Schema task_mng
-- -----------------------------------------------------
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`user` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(16) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(32) NOT NULL,
  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`));


-- -----------------------------------------------------
-- Table `mydb`.`task_category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`task_category` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NULL,
  `user_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`),
  INDEX `tc_userid_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `tc_userid`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`task`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`task` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `create_time` TIMESTAMP NULL DEFAULT now(),
  `due_to` TIMESTAMP NULL,
  `status` ENUM('progress', 'completed', 'expired') NULL DEFAULT 'progress',
  `category_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `task_category_idx` (`category_id` ASC) VISIBLE,
  CONSTRAINT `task_category`
    FOREIGN KEY (`category_id`)
    REFERENCES `mydb`.`task_category` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`user_settings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`user_settings` (
  `user_id` VARCHAR(64) NOT NULL,
  `dark_mode` TINYINT NOT NULL DEFAULT 1,
  `language` ENUM('en', 'vi') NOT NULL DEFAULT 'en',
  `font` ENUM('1', '2') NOT NULL DEFAULT '1',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `us_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`refresh_token`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`refresh_token` (
  `refresh_token` VARCHAR(256) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  `status` TINYINT NULL DEFAULT 1,
  PRIMARY KEY (`refresh_token`),
  INDEX ` rf_user_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT ` rf_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`note`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`note` (
  `id` VARCHAR(64) NOT NULL,
  `task_id` VARCHAR(64) NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `note_task_idx` (`task_id` ASC) VISIBLE,
  CONSTRAINT `note_task`
    FOREIGN KEY (`task_id`)
    REFERENCES `mydb`.`task` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

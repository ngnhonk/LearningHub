-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema learning_hub
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema learning_hub
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `learning_hub` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `learning_hub` ;

-- -----------------------------------------------------
-- Table `learning_hub`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`users` (
  `id` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) NOT NULL,
  `full_name` VARCHAR(128) NULL,
  `username` VARCHAR(128) NOT NULL,
  `hashed_password` VARCHAR(255) NOT NULL,
  `role` ENUM("student", "admin") NOT NULL DEFAULT 'student',
  `avatar_url` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`refresh_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`refresh_tokens` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(128) NOT NULL,
  `hashed_token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `device_info` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `rf_u_id_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `rf_u_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `learning_hub`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`subjects`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`subjects` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(128) NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`exams`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`exams` (
  `id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `subject_id` VARCHAR(128) NOT NULL,
  `duration_minutes` INT NOT NULL,
  `total_marks` INT NOT NULL,
  `pass_percentage` DECIMAL(5,2) NOT NULL DEFAULT 50,
  `is_published` TINYINT NULL DEFAULT 0,
  `created_by` VARCHAR(128) NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  INDEX `exam_created_by_idx` (`created_by` ASC) VISIBLE,
  INDEX `exam_subject_id_idx` (`subject_id` ASC) VISIBLE,
  CONSTRAINT `exam_created_by`
    FOREIGN KEY (`created_by`)
    REFERENCES `learning_hub`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT `exam_subject_id`
    FOREIGN KEY (`subject_id`)
    REFERENCES `learning_hub`.`subjects` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`questions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`questions` (
  `id` VARCHAR(128) NOT NULL,
  `content` TEXT NOT NULL,
  `created_by` VARCHAR(128) NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  INDEX `question_created_by_idx` (`created_by` ASC) VISIBLE,
  CONSTRAINT `question_created_by`
    FOREIGN KEY (`created_by`)
    REFERENCES `learning_hub`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`exam_questions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`exam_questions` (
  `id` VARCHAR(128) NOT NULL,
  `exam_id` VARCHAR(128) NULL,
  `question_id` VARCHAR(128) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_exam_question` (`exam_id` ASC, `question_id` ASC) INVISIBLE,
  INDEX `eq_q_id_idx` (`question_id` ASC) VISIBLE,
  CONSTRAINT `eq_e_id`
    FOREIGN KEY (`exam_id`)
    REFERENCES `learning_hub`.`exams` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `eq_q_id`
    FOREIGN KEY (`question_id`)
    REFERENCES `learning_hub`.`questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`user_examp_attempts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`user_examp_attempts` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(128) NULL,
  `exam_id` VARCHAR(128) NULL,
  `status` ENUM('in_progress', 'submitted', 'time_out') NULL DEFAULT 'in_progress',
  `score` DECIMAL(5,2) NULL,
  `started_at` TIMESTAMP NULL DEFAULT now(),
  `submitted_at` TIMESTAMP NULL,
  `time_spent_seconds` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `uea_u_id_idx` (`user_id` ASC) VISIBLE,
  INDEX `uea_e_id_idx` (`exam_id` ASC) VISIBLE,
  CONSTRAINT `uea_u_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `learning_hub`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `uea_e_id`
    FOREIGN KEY (`exam_id`)
    REFERENCES `learning_hub`.`exams` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`answers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`answers` (
  `id` VARCHAR(128) NOT NULL,
  `question_id` VARCHAR(128) NULL,
  `content` TEXT NOT NULL,
  `is_correct` TINYINT(1) NULL DEFAULT 0,
  `display_order` INT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `a_q_id_idx` (`question_id` ASC) VISIBLE,
  CONSTRAINT `a_q_id`
    FOREIGN KEY (`question_id`)
    REFERENCES `learning_hub`.`questions` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `learning_hub`.`user_answers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_hub`.`user_answers` (
  `id` VARCHAR(128) NOT NULL,
  `attemp_id` VARCHAR(128) NULL,
  `question_id` VARCHAR(128) NULL,
  `selected_answer_id` VARCHAR(128) NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `answered_at` TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY (`id`),
  INDEX `ua_uea_id_idx` (`attemp_id` ASC) VISIBLE,
  INDEX `ua_q_id_idx` (`question_id` ASC) VISIBLE,
  INDEX `ua_a_id_idx` (`selected_answer_id` ASC) VISIBLE,
  UNIQUE INDEX `ua_uq_a_q` (`attemp_id` ASC, `question_id` ASC) VISIBLE,
  CONSTRAINT `ua_uea_id`
    FOREIGN KEY (`attemp_id`)
    REFERENCES `learning_hub`.`user_examp_attempts` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `ua_q_id`
    FOREIGN KEY (`question_id`)
    REFERENCES `learning_hub`.`questions` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `ua_a_id`
    FOREIGN KEY (`selected_answer_id`)
    REFERENCES `learning_hub`.`answers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

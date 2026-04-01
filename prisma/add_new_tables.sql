-- Safe migration: Only ADDS new tables. Does NOT touch existing data.

CREATE TABLE IF NOT EXISTS `sessions` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `session_code` VARCHAR(50)  NULL,
  `created_at`   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  `final_grade`  INT          NULL,
  `grade_label`  VARCHAR(20)  NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `exercises` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `session_id` INT          NULL,
  `name`       VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  INDEX `session_id` (`session_id`),
  CONSTRAINT `exercises_ibfk_1`
    FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS `exercise_submissions` (
  `id`          INT       NOT NULL AUTO_INCREMENT,
  `exercise_id` INT       NULL,
  `score`       INT       NULL,
  `notes`       TEXT      NULL,
  `canvas_data` JSON      NULL,
  `updated_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `session_id`  INT       NULL,
  PRIMARY KEY (`id`),
  INDEX `exercise_id` (`exercise_id`),
  CONSTRAINT `exercise_submissions_ibfk_1`
    FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

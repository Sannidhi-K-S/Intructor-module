-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_title` VARCHAR(191) NOT NULL,
    `instructor_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `aircraft_id` INTEGER NULL,
    `simulator_id` INTEGER NULL,
    `training_type` ENUM('Flight_Training', 'Simulator', 'Ground_School') NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

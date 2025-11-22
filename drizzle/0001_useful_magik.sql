CREATE TABLE `staff` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`qualifications` json NOT NULL,
	`maxPatients` int NOT NULL,
	`maxWorkload` int NOT NULL,
	`primaryUnit` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_id` PRIMARY KEY(`id`)
);

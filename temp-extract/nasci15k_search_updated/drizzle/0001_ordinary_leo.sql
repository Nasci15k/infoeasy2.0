CREATE TABLE `apiEndpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`method` varchar(10) NOT NULL DEFAULT 'GET',
	`parameterName` varchar(50) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiEndpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchQueries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`searchType` varchar(50) NOT NULL,
	`searchValue` varchar(255) NOT NULL,
	`results` json,
	`status` enum('success','error','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchQueries_id` PRIMARY KEY(`id`)
);

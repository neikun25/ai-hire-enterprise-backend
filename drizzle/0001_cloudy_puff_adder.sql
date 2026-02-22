CREATE TABLE `enterprises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`license` varchar(255),
	`contact` varchar(100),
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`creditScore` decimal(3,1) NOT NULL DEFAULT '5.0',
	`totalTasks` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enterprises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `individuals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`realName` varchar(100),
	`skills` text,
	`experience` text,
	`portfolio` text,
	`creditScore` decimal(3,1) NOT NULL DEFAULT '5.0',
	`completedTasks` int NOT NULL DEFAULT 0,
	`successRate` decimal(5,2) NOT NULL DEFAULT '100.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `individuals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`individualId` int NOT NULL,
	`status` enum('in_progress','submitted','completed','rejected') NOT NULL DEFAULT 'in_progress',
	`submitContent` text,
	`submitAttachments` text,
	`submitTime` timestamp,
	`reviewComment` text,
	`reviewTime` timestamp,
	`actualAmount` decimal(10,2),
	`viewCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`reviewType` enum('enterprise_to_individual','individual_to_enterprise') NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enterpriseId` int NOT NULL,
	`type` enum('report','video','labeling') NOT NULL,
	`subType` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`requirements` text,
	`attachments` text,
	`budget` decimal(10,2) NOT NULL,
	`isVideoTask` int NOT NULL DEFAULT 0,
	`basePrice` decimal(10,2),
	`pricePerThousandViews` decimal(10,2),
	`deadline` timestamp NOT NULL,
	`status` enum('pending','approved','in_progress','submitted','completed','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('recharge','freeze','unfreeze','pay','income','withdraw') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`balance` decimal(10,2) NOT NULL,
	`relatedId` int,
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('enterprise','individual','admin') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);
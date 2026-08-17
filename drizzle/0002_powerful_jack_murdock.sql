CREATE TABLE `attachmentCandidates` (
	`id` varchar(64) NOT NULL,
	`attachmentId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`quality` int NOT NULL,
	`tokens` int NOT NULL,
	`complexity` int NOT NULL,
	`reliability` int NOT NULL,
	`status` enum('pareto','dominated') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachmentCandidates_id` PRIMARY KEY(`id`)
);

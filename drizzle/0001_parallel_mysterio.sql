CREATE TABLE `attachmentArtifacts` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`version` varchar(32) NOT NULL,
	`manifest` text,
	`policy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachmentArtifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attachmentDatasets` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`format` enum('JSONL','CSV','manual') NOT NULL,
	`domain` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`records` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachmentDatasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attachmentTraces` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`route` text NOT NULL,
	`score` int NOT NULL,
	`latencyMs` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachmentTraces_id` PRIMARY KEY(`id`)
);

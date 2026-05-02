CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`device` varchar(255) NOT NULL,
	`status` enum('on','off') NOT NULL DEFAULT 'off',
	`room` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`image` varchar(1024),
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);

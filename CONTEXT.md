
# Project Overview

The Cannabis Grow Tracker Discord Bot is a web application built using Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. The bot allows users to track their cannabis grows by creating new grows, monitoring plant progress, and receiving daily prompts to update information. The bot also generates a daily summary with embedded information and attached pictures.

# Tech Stack

* **Next.js 14 (App Router)**: We chose Next.js for its robust routing capabilities, server-side rendering, and easy integration with TypeScript.
* **TypeScript**: We use TypeScript to ensure type safety and maintainability throughout the codebase.
* **Tailwind CSS**: Tailwind CSS is used for styling and layout management, providing a consistent and responsive design across the application.
* **shadcn/ui**: shadcn/ui is a set of React components designed specifically for Discord bots, making it easy to integrate with the Discord API.
* **Supabase**: Supabase is used as our database and API layer, providing a scalable and reliable solution for storing and retrieving data.

# Architecture

The application is structured into the following components:

* **Components**: These are reusable React components that handle specific UI elements, such as forms, buttons, and lists.
* **Services**: These are separate files that contain business logic and data access layers. They interact with the Supabase database and provide data to the components.
* **State Management**: We use the `useState` hook from React to manage state changes throughout the application.

# Folder Structure

The recommended directory layout is as follows:

```
root
components
GrowTracker.js
forms
GrowForm.js
...
services
GrowService.js
...
pages
index.js
...
public
images
...
styles
tailwind.config.js
...
supabase
...
package.json
```

# Key Decisions

* **Database Schema**: We chose to use a single table to store grow data, with columns for grow ID, strain, germination method, pot size, harvest date, wet weight, dry weight, harvest notes, and other relevant information.
* **Grow Limits**: Users can have up to 20 ongoing (non-harvested) grows at a time. Harvested grows are separate from ongoing grows.
* **API Routes**: We created separate API routes for creating new grows, updating grow information, and retrieving grow data.
* **Authentication**: We implemented authentication using Supabase's built-in authentication features.

# Implementation Guidelines

* **Code Style**: We follow the official TypeScript style guide and the Next.js coding conventions.
* **Naming Conventions**: We use PascalCase for component names and camelCase for variable names.
* **Best Practices**: We follow best practices for error handling, logging, and debugging.

# Features Breakdown

1. **Create New Grow**: Users can create new grows by sending the `!startgrow` command. The bot will first prompt for the grow start date in `XX/XX/XXXX` format, which sets the timer baseline. The bot will then prompt for additional basic information and create a new grow in the database.
2. **Daily Prompts**: The bot will send daily prompts to users to update grow information, including pictures, environment, feeding, growth stage, plant health, and additional notes.
3. **Grow Timer**: The bot will track the grow timer, calculating elapsed days from the start date provided when creating a new grow. The start date is set in `XX/XX/XXXX` format during the `!startgrow` command flow, and the timer uses this date to determine how many days have passed since the grow began.
4. **Flower Stage**: When a user sends the `!flower` command, the bot will start a new grow timer and prompt for additional information about terpene smell and flower development.
5. **Embedded Summaries**: The bot will generate daily summaries with embedded information and attached pictures.
6. **Harvest**: When a user sends the `!harvest` command, the bot stops the grow log for that grow. This includes stopping daily prompts, stopping the grow timer, and marking the grow as harvested in the database with a harvest date.
7. **Results**: After a grow has been harvested using `!harvest`, users can send the `!results` command to input harvest data. The bot will prompt for wet weight, dry weight, and notes. Users can update these results multiple times. The command can only be used after `!harvest` has been called (validation required).

# API & Database

* **Supabase Schema**: The Supabase schema includes a single table for grow data, with columns for grow ID, strain, germination method, pot size, harvest date, wet weight, dry weight, harvest notes, and other relevant information. The schema also tracks whether a grow has been harvested and its current status.
* **API Routes**: We created the following API routes:
	+ `POST /grows`: Creates a new grow
	+ `GET /grows`: Retrieves a list of all grows
	+ `GET /grows/:id`: Retrieves a single grow by ID
	+ `PUT /grows/:id`: Updates a single grow
	+ `DELETE /grows/:id`: Deletes a single grow
* **Authentication**: We implemented authentication using Supabase's built-in authentication features.

This comprehensive CONTEXT.md file provides a detailed technical overview of the Cannabis Grow Tracker Discord Bot, including project overview, tech stack, architecture, folder structure, key decisions, implementation guidelines, features breakdown, and API & database schema. This should enable an AI IDE to build the entire app correctly.
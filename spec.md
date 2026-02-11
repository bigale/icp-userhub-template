# Multi User System with Role Based Access

## Overview
A simple multi-user application with Internet Identity authentication, role-based access control, and user profile management.

## Authentication
- Users authenticate using Internet Identity
- New users are automatically registered upon first login
- All authenticated users have access to the application

## User Roles
The system supports two roles:
- **Admin**: Has administrative privileges
- **User**: Standard user with basic access

Role assignment is handled through the backend, with the ability to promote users to admin status.

## User Profiles
- All users (both admins and regular users) have editable profiles
- Profile information includes name, email (optional), and bio (optional)
- Users can view and edit their own profiles through a functional editable form interface
- Clicking the "Edit Profile" button opens a visible, editable form with current profile data pre-populated
- The form includes fields for name, email, and bio with proper input validation
- Users can save changes or cancel editing to return to view mode
- After successful save, a success message is displayed and the profile view is updated with new data
- Changes are properly synchronized with the backend
- Admins can view all user profiles

## Backend Data Storage
The backend stores:
- User accounts with associated Internet Identity principals
- User roles (admin/user)
- User profile information (name, email, bio)
- Role assignments and permissions

## Core Functionality
- User registration and authentication via Internet Identity
- Role-based access control system
- Profile creation and editing for all users with fully functional form interface
- Profile form state management (view/edit modes)
- Success messaging and data refresh after profile updates
- Admin interface for user management
- Modular architecture for future permission system extensions

## Architecture Notes
The system is designed with modularity in mind to allow for future integration of custom permission logic and external systems.

## Language
- Application content is displayed in English

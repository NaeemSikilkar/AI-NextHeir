# NextHeir - AI-Powered Inheritance Decision Platform

## Problem Statement
Build a web-based AI product for high-net-worth individuals to simulate wealth distribution and avoid family conflicts.

## Architecture
- **Backend**: FastAPI + MongoDB + JWT Auth + Gemini 3 Flash (via emergentintegrations)
- **Frontend**: React + TailwindCSS + Shadcn UI + Recharts + Framer Motion
- **Database**: MongoDB (collections: users, scenarios, chat_history, login_attempts)
- **AI**: Gemini 3 Flash via Emergent LLM Key for chat and comparison advice

## User Personas
1. **High-Net-Worth Individual (HNI)**: Primary user who wants to plan inheritance fairly
2. **Family Advisor**: May use tool to present scenarios to clients

## Core Requirements
- Landing page with hero, how-it-works, trust section
- JWT email/password authentication
- Dashboard with scenario management
- 3-step scenario creation: Assets → Family → Distribution
- Simulation engine with fairness scoring and risk alerts
- Results dashboard with charts (pie/bar) and AI chat
- Compare scenarios page with AI comparison chat

## What's Been Implemented (April 2026)
- Full landing page with dark luxury theme (Metallic Black + Metallic Sage Green)
- JWT auth (register, login, logout, refresh) with admin seeding
- Dashboard with scenario CRUD
- 3-step scenario wizard (assets, family mapping, distribution with 100% validation)
- Simulation engine: fairness scoring, risk alerts, 5-year projections
- Results dashboard: Recharts pie/bar charts, fairness gauge, distribution breakdown
- AI Chat panel on results page (Gemini 3 Flash)
- Compare scenarios page with AI comparison chat
- All tests passing: 100% backend, 100% frontend, 100% integration

## Prioritized Backlog
### P0 (Critical) - DONE
- [x] Landing page
- [x] Authentication
- [x] Scenario CRUD
- [x] Simulation engine
- [x] Results dashboard
- [x] AI Chat

### P1 (Important)
- [ ] PDF export of scenario results
- [ ] Email sharing of reports
- [ ] Multiple scenario templates

### P2 (Nice to have)
- [ ] Multi-currency support
- [ ] Tax implications calculator
- [ ] Legal jurisdiction considerations
- [ ] Family tree visualization

## Next Tasks
1. PDF export of simulation results
2. Scenario templates for common distribution patterns
3. Enhanced AI with more context-specific advice

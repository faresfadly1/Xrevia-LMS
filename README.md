# Xrevia LMS

Xrevia LMS is a university-style learning management system built with a Vue 3 + Vite frontend and custom Odoo addons.

## Structure

- `src/`: Vue frontend source for the LMS website experience
- `public/`: static frontend assets
- `odoo-addons/my_custom_lms/`: base LMS Odoo module
- `odoo-addons/my_custom_lms_live/`: live university LMS extensions and controllers
- `odoo-addons/xrevia_lms_vue/`: Odoo website wrapper and deployed frontend integration

## Frontend

```bash
npm install
npm run dev
npm run build
npm run build:pages
```

## GitHub Pages Demo

The public GitHub Pages site runs in a self-contained demo mode with seeded university data and role switching for:

- Student
- Teacher
- Admin

The root `index.html` automatically loads the built demo assets on GitHub Pages and the Vite source entry during local development.

To refresh the public demo assets after frontend changes:

```bash
npm run build:pages
```

That command rebuilds the app and syncs the generated static files into the repo root `assets/` folder for GitHub Pages.

## Odoo Addons

Copy the addons inside `odoo-addons/` into your Odoo custom addons path or point `addons_path` to them.

## Notes

- The live frontend assets are served through Odoo.
- The GitHub Pages version is a static demo and does not require the Odoo backend.
- The repository keeps the frontend source and the Odoo implementation together so the full LMS can be versioned in one place.

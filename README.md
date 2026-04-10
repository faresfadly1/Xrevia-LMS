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
npm run build
```

## Odoo Addons

Copy the addons inside `odoo-addons/` into your Odoo custom addons path or point `addons_path` to them.

## Notes

- The live frontend assets are served through Odoo.
- The repository keeps the frontend source and the Odoo implementation together so the full LMS can be versioned in one place.

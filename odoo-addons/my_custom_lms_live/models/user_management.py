from odoo import api, fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    x_lms_role = fields.Selection(
        [
            ("admin", "LMS Admin"),
            ("student", "LMS Student"),
            ("teacher", "LMS Teacher"),
        ],
        string="LMS Role",
        copy=False,
        help="Choose the LMS role. The system will automatically switch the user between admin, student, and teacher safely.",
    )

    def _admin_role_group_ids(self):
        xmlids = [
            "base.group_user",
            "base.group_system",
            "base.group_partner_manager",
            "base.group_allow_export",
            "my_custom_lms.group_lms_admin",
        ]
        return [self.env.ref(xmlid).id for xmlid in xmlids if self.env.ref(xmlid, raise_if_not_found=False)]

    def _teacher_role_group_ids(self):
        xmlids = [
            "base.group_user",
            "base.group_erp_manager",
            "base.group_system",
            "my_custom_lms.group_lms_teacher",
            "base.group_partner_manager",
            "base.group_allow_export",
        ]
        return [self.env.ref(xmlid).id for xmlid in xmlids if self.env.ref(xmlid, raise_if_not_found=False)]

    def _student_role_group_ids(self):
        xmlids = [
            "base.group_user",
            "base.group_erp_manager",
            "base.group_system",
            "my_custom_lms.group_lms_student",
            "base.group_partner_manager",
            "base.group_allow_export",
        ]
        return [self.env.ref(xmlid).id for xmlid in xmlids if self.env.ref(xmlid, raise_if_not_found=False)]

    def _lms_group_field_names(self):
        admin_group = self.env.ref("my_custom_lms.group_lms_admin", raise_if_not_found=False)
        teacher_group = self.env.ref("my_custom_lms.group_lms_teacher", raise_if_not_found=False)
        student_group = self.env.ref("my_custom_lms.group_lms_student", raise_if_not_found=False)
        return {
            "admin": f"in_group_{admin_group.id}" if admin_group else False,
            "teacher": f"in_group_{teacher_group.id}" if teacher_group else False,
            "student": f"in_group_{student_group.id}" if student_group else False,
        }

    def _infer_lms_role(self):
        self.ensure_one()
        admin_group = self.env.ref("my_custom_lms.group_lms_admin", raise_if_not_found=False)
        teacher_group = self.env.ref("my_custom_lms.group_lms_teacher", raise_if_not_found=False)
        student_group = self.env.ref("my_custom_lms.group_lms_student", raise_if_not_found=False)
        if admin_group and admin_group in self.groups_id:
            return "admin"
        if teacher_group and teacher_group in self.groups_id:
            return "teacher"
        if student_group and student_group in self.groups_id:
            return "student"
        return False

    def _resolve_groups_after_commands(self, vals, user=None):
        current_group_ids = set(user.groups_id.ids if user else [])
        commands = vals.get("groups_id") or []

        if isinstance(commands, tuple):
            commands = [commands]

        for command in commands:
            if not isinstance(command, (list, tuple)) or not command:
                continue

            operation = command[0]
            if operation == 6:
                current_group_ids = set(command[2] or [])
            elif operation == 4:
                current_group_ids.add(command[1])
            elif operation in (2, 3):
                current_group_ids.discard(command[1])
            elif operation == 5:
                current_group_ids.clear()

        return current_group_ids

    def _extract_role_from_vals(self, vals, user=None):
        explicit_role = vals.get("x_lms_role")
        if explicit_role in {"admin", "student", "teacher"}:
            return explicit_role

        role_fields = self._lms_group_field_names()
        admin_field = role_fields.get("admin")
        student_field = role_fields.get("student")
        teacher_field = role_fields.get("teacher")

        if admin_field and vals.get(admin_field):
            return "admin"
        if teacher_field and vals.get(teacher_field):
            return "teacher"
        if student_field and vals.get(student_field):
            return "student"

        if "groups_id" not in vals:
            return False

        admin_group = self.env.ref("my_custom_lms.group_lms_admin", raise_if_not_found=False)
        teacher_group = self.env.ref("my_custom_lms.group_lms_teacher", raise_if_not_found=False)
        student_group = self.env.ref("my_custom_lms.group_lms_student", raise_if_not_found=False)
        group_ids = self._resolve_groups_after_commands(vals, user=user)

        if admin_group and admin_group.id in group_ids:
            return "admin"
        if teacher_group and teacher_group.id in group_ids:
            return "teacher"
        if student_group and student_group.id in group_ids:
            return "student"
        return False

    def _normalize_lms_role_vals(self, vals, user=None):
        target_role = self._extract_role_from_vals(vals, user=user)
        normalized_vals = dict(vals)

        if target_role not in {"admin", "student", "teacher"}:
            return normalized_vals, False

        for key in list(normalized_vals):
            if key.startswith("in_group_") or key.startswith("sel_groups_"):
                normalized_vals.pop(key, None)

        normalized_vals.pop("groups_id", None)

        if target_role == "admin":
            normalized_vals.update(
                {
                    "groups_id": [(6, 0, self._admin_role_group_ids())],
                    "share": False,
                    "x_lms_role": "admin",
                    "active": True,
                }
            )
        elif target_role == "teacher":
            normalized_vals.update(
                {
                    "groups_id": [(6, 0, self._teacher_role_group_ids())],
                    "share": False,
                    "x_lms_role": "teacher",
                    "active": True,
                }
            )
        else:
            normalized_vals.update(
                {
                    "groups_id": [(6, 0, self._student_role_group_ids())],
                    "share": False,
                    "x_lms_role": "student",
                    "active": True,
                }
            )

        return normalized_vals, target_role

    @api.model_create_multi
    def create(self, vals_list):
        normalized_vals_list = []
        for vals in vals_list:
            normalized_vals, _target_role = self._normalize_lms_role_vals(vals)
            normalized_vals_list.append(normalized_vals)

        users = super().create(normalized_vals_list)

        for user in users:
            inferred = user._infer_lms_role()
            if inferred and user.x_lms_role != inferred:
                user.with_context(skip_lms_role_apply=True).sudo().write({"x_lms_role": inferred})

        return users

    def write(self, vals):
        if self.env.context.get("skip_lms_role_apply"):
            return super().write(vals)

        normalized_vals, target_role = self._normalize_lms_role_vals(
            vals,
            user=self[:1] if len(self) == 1 else None,
        )
        res = super().write(normalized_vals)

        if target_role in {"admin", "student", "teacher"}:
            for user in self:
                if user.x_lms_role != target_role:
                    user.with_context(skip_lms_role_apply=True).sudo().write({"x_lms_role": target_role})
        elif "groups_id" in vals or any(
            key.startswith("in_group_") or key.startswith("sel_groups_")
            for key in vals
        ):
            for user in self:
                inferred = user._infer_lms_role()
                if user.x_lms_role != inferred:
                    user.with_context(skip_lms_role_apply=True).sudo().write({"x_lms_role": inferred})

        return res

    def unlink(self):
        employee_model = self.env["hr.employee"].sudo()
        lms_users = self.filtered(
            lambda user: user.has_group("my_custom_lms.group_lms_admin")
            or user.has_group("my_custom_lms.group_lms_teacher")
            or user.has_group("my_custom_lms.group_lms_student")
        )
        employee_linked_users = self.filtered(
            lambda user: bool(employee_model.search_count([("user_id", "=", user.id)]))
        )
        protected_users = lms_users | employee_linked_users
        remaining = self - protected_users

        if protected_users:
            linked_employees = employee_model.search([("user_id", "in", protected_users.ids)])
            if linked_employees and "active" in linked_employees._fields:
                linked_employees.filtered("active").write({"active": False})
            protected_users.filtered("active").write({"active": False})

        if remaining:
            return super(ResUsers, remaining).unlink()
        return True

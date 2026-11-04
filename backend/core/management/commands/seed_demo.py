from django.core.management.base import BaseCommand

from core.utils import ensure_role_groups


class Command(BaseCommand):
    help = "Carga datos de demostración (usuarios, cursos, transacciones simuladas)."

    def handle(self, *args, **options):
        from django.conf import settings
        from django.contrib.auth.models import Group

        from core.models import Category, SiteSettings
        from courses.models import Course, CourseModule, CourseStatus, Lesson
        from enrollments.models import Enrollment, LessonProgress
        from payments.models import Transaction, TransactionStatus
        from tickets.models import SupportTicket, TicketPriority
        from users.models import User

        from core.demo_media import ensure_cover_jpegs, repo_root

        ensure_role_groups()
        SiteSettings.load()
        ensure_cover_jpegs(["c1", "c2", "c3", "c4"])

        categories = [
            ("fundamentos", "Fundamentos", 1),
            ("estudios-biblicos", "Estudios bíblicos", 2),
            ("liderazgo", "Liderazgo", 3),
            ("familia", "Familia", 4),
            ("oracion", "Oración", 5),
            ("musica", "Música", 6),
        ]
        for slug, name, order in categories:
            Category.objects.get_or_create(slug=slug, defaults={"name": name, "order": order})

        demo_users = [
            ("alumno", "camila.m", "Camila", "Muñoz", settings.GROUP_ALUMNO, False),
            ("profesor", "f.rojas", "Felipe", "Rojas", settings.GROUP_PROFESOR, False),
            ("soporte", "marta.ibanez", "Marta", "Ibáñez", settings.GROUP_ADMINISTRACION, False),
            ("admin", "carlos.mendez", "Carlos", "Méndez", settings.GROUP_ADMIN, True),
        ]
        password = "Demo2026!"
        users = {}
        for _key, username, first, last, group_name, superuser in demo_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@demo.local",
                    "first_name": first,
                    "last_name": last,
                },
            )
            if created:
                user.set_password(password)
            user.is_superuser = superuser
            user.is_staff = superuser or group_name == settings.GROUP_ADMINISTRACION
            user.save()
            g = Group.objects.get(name=group_name)
            user.groups.set([g])
            users[group_name] = user

        felipe = users[settings.GROUP_PROFESOR]
        cat_estudios = Category.objects.get(slug="estudios-biblicos")
        cat_fund = Category.objects.get(slug="fundamentos")
        cat_lid = Category.objects.get(slug="liderazgo")

        course_defs = [
            {
                "title": "Fundamentos de la Fe",
                "slug": "fundamentos-de-la-fe",
                "teacher": felipe,
                "category": cat_fund,
                "price": 0,
                "cover_placeholder": "c1",
                "duration": 260,
                "students": 980,
                "rating": 4.9,
            },
            {
                "title": "Liderazgo con Propósito",
                "slug": "liderazgo-con-proposito",
                "teacher": felipe,
                "category": cat_lid,
                "price": 29990,
                "cover_placeholder": "c2",
                "duration": 365,
                "students": 540,
                "rating": 4.8,
            },
            {
                "title": "Estudio de Romanos",
                "slug": "estudio-de-romanos",
                "teacher": felipe,
                "category": cat_estudios,
                "price": 24990,
                "cover_placeholder": "c3",
                "duration": 520,
                "students": 1284,
                "rating": 4.9,
            },
        ]

        objectives_romans = [
            "Contexto histórico y propósito de la carta",
            "El significado de la justificación por la fe",
            "Cómo vivir guiado por el Espíritu",
            "El plan de Dios para Israel y las naciones",
            "Aplicar Romanos 12 a tu comunidad",
            "Herramientas para estudiar la Biblia por tu cuenta",
        ]
        objectives_fund = [
            "Comprender las bases de la fe cristiana",
            "Desarrollar una vida de oración",
            "Conocer la Biblia como guía",
            "Vivir en comunidad con otros creyentes",
        ]
        objectives_lid = [
            "Definir liderazgo servicial según las Escrituras",
            "Identificar tu llamado y dones",
            "Formar equipos saludables",
            "Tomar decisiones con sabiduría",
        ]

        modules_by_slug = {
            "fundamentos-de-la-fe": [
                ("Introducción a la fe", 3, 45),
                ("La Biblia y la oración", 3, 50),
                ("Vida en comunidad", 2, 40),
            ],
            "liderazgo-con-proposito": [
                ("Fundamentos del liderazgo", 4, 55),
                ("Servir con humildad", 3, 60),
                ("Decisiones y visión", 3, 50),
            ],
            "estudio-de-romanos": [
                ("Introducción a la carta", 4, 38),
                ("El problema del pecado (Rom 1–3)", 5, 72),
                ("Justificación por la fe (Rom 3–5)", 4, 65),
                ("Vida en el Espíritu (Rom 6–8)", 5, 100),
                ("Israel y las naciones (Rom 9–11)", 3, 58),
                ("Fe vivida en comunidad (Rom 12–16)", 5, 87),
            ],
        }

        objectives_by_slug = {
            "fundamentos-de-la-fe": objectives_fund,
            "liderazgo-con-proposito": objectives_lid,
            "estudio-de-romanos": objectives_romans,
        }

        sample = repo_root() / "e2e" / "fixtures" / "sample.mp4"

        def rebuild_modules(course, module_specs):
            from core.demo_media import ensure_lesson_hls

            course.modules.all().delete()
            for idx, (title, n_lessons, mins) in enumerate(module_specs):
                mod = CourseModule.objects.create(course=course, title=title, order=idx)
                for li in range(n_lessons):
                    sec = (mins * 60) // max(n_lessons, 1)
                    lesson_title = f"Lección {li + 1}: {title}"
                    lesson = Lesson.objects.create(
                        module=mod,
                        title=lesson_title,
                        order=li,
                        duration_seconds=sec,
                        is_preview=li == 0 and idx == 0,
                        video_status="processing",
                    )
                    rel = ensure_lesson_hls(lesson.id, sample if sample.exists() else None)
                    lesson.hls_path = rel
                    lesson.video_status = "ready"
                    lesson.save(update_fields=["hls_path", "video_status"])
            course.recalc_duration()

        for cdef in course_defs:
            course, _ = Course.objects.update_or_create(
                slug=cdef["slug"],
                defaults={
                    "title": cdef["title"],
                    "teacher": cdef["teacher"],
                    "category": cdef["category"],
                    "description": f"Curso demo: {cdef['title']}.",
                    "status": CourseStatus.PUBLISHED,
                    "price_clp": cdef["price"],
                    "proposed_price_clp": cdef["price"],
                    "duration_minutes": cdef["duration"],
                    "student_count": cdef["students"],
                    "rating_avg": cdef["rating"],
                    "rating_count": 100,
                    "cover_placeholder": cdef["cover_placeholder"],
                    "learning_objectives": objectives_by_slug.get(cdef["slug"], objectives_fund),
                },
            )
            specs = modules_by_slug.get(cdef["slug"])
            if specs:
                rebuild_modules(course, specs)

        camila = users[settings.GROUP_ALUMNO]
        romans = Course.objects.get(slug="estudio-de-romanos")
        enrollment, _ = Enrollment.objects.get_or_create(user=camila, course=romans, defaults={"is_active": True})
        LessonProgress.objects.filter(enrollment=enrollment).delete()
        lessons = Lesson.objects.filter(module__course=romans).order_by("module__order", "order")
        for i, lesson in enumerate(lessons):
            lp, _ = LessonProgress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
            lp.completed = i < 6
            lp.last_position_seconds = 472 if i == 6 else 0
            lp.save()

        Transaction.objects.get_or_create(
            external_id="TX-10482",
            defaults={
                "user": camila,
                "course": romans,
                "amount_clp": 24990,
                "method": "webpay",
                "status": TransactionStatus.PAID,
            },
        )

        liderazgo = Course.objects.get(slug="liderazgo-con-proposito")
        Transaction.objects.get_or_create(
            external_id="TX-10483",
            defaults={
                "user": camila,
                "course": liderazgo,
                "amount_clp": 29990,
                "method": "webpay",
                "status": TransactionStatus.PAID,
            },
        )

        SupportTicket.objects.get_or_create(
            user=camila,
            subject="No puedo descargar mi certificado",
            defaults={
                "body": "Demo ticket",
                "priority": TicketPriority.HIGH,
            },
        )

        from courses.models import CourseQuestion, CourseReview

        first_romans_lesson = Lesson.objects.filter(module__course=romans).order_by(
            "module__order", "order"
        ).first()
        CourseQuestion.objects.get_or_create(
            course=romans,
            student=camila,
            question="¿Cómo aplico Romanos 12 en el servicio diario?",
            defaults={"lesson": first_romans_lesson},
        )
        CourseQuestion.objects.get_or_create(
            course=Course.objects.get(slug="fundamentos-de-la-fe"),
            student=camila,
            question="¿Hay material extra para el módulo de oración?",
            defaults={},
        )
        CourseReview.objects.update_or_create(
            course=romans,
            student=camila,
            defaults={"rating": 5, "body": "Profundidad bíblica excelente y muy clara."},
        )
        CourseReview.objects.update_or_create(
            course=Course.objects.get(slug="liderazgo-con-proposito"),
            student=camila,
            defaults={"rating": 5, "body": "Muy práctico para líderes de célula."},
        )

        from certificates.services import issue_certificate

        from certificates.models import Certificate

        if not Certificate.objects.filter(enrollment=enrollment).exists():
            try:
                issue_certificate(enrollment)
            except Exception:
                pass

        # Extra cursos demo para panel profesor
        Course.objects.update_or_create(
            slug="cartas-de-pablo-ii",
            defaults={
                "title": "Cartas de Pablo II",
                "teacher": felipe,
                "category": cat_estudios,
                "description": "En revisión.",
                "status": CourseStatus.REVIEW,
                "price_clp": 0,
                "cover_placeholder": "c1",
            },
        )
        Course.objects.update_or_create(
            slug="hebreos-mejor-pacto",
            defaults={
                "title": "Hebreos: Mejor Pacto",
                "teacher": felipe,
                "category": cat_estudios,
                "description": "Borrador.",
                "status": CourseStatus.DRAFT,
                "price_clp": 0,
                "cover_placeholder": "c4",
            },
        )

        from core.demo_media import ensure_lesson_hls

        sample_mp4 = repo_root() / "e2e" / "fixtures" / "sample.mp4"
        for lesson in Lesson.objects.all():
            rel = ensure_lesson_hls(lesson.id, sample_mp4 if sample_mp4.exists() else None)
            if lesson.hls_path != rel or lesson.video_status != "ready":
                lesson.hls_path = rel
                lesson.video_status = "ready"
                lesson.save(update_fields=["hls_path", "video_status"])

        self.stdout.write(self.style.SUCCESS("Datos demo cargados."))
        self.stdout.write(f"Contraseña demo para todos: {password}")

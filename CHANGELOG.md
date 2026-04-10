## [1.24.4](https://github.com/rkromero/SaaS-POS/compare/v1.24.3...v1.24.4) (2026-04-10)


### Bug Fixes

* normalizar NEXT_PUBLIC_APP_URL eliminando barra final para OAuth de MP ([d284028](https://github.com/rkromero/SaaS-POS/commit/d2840280bbc995aa79e4fa72ec76138a2883d0a0))

## [1.24.3](https://github.com/rkromero/SaaS-POS/compare/v1.24.2...v1.24.3) (2026-04-09)


### Bug Fixes

* select explícito en OrgAccess y manejo de error en mp-control mientras migración pendiente ([1a46167](https://github.com/rkromero/SaaS-POS/commit/1a461678bd30676dcd0d6d6f6023c0a09bfcd342))

## [1.24.2](https://github.com/rkromero/SaaS-POS/compare/v1.24.1...v1.24.2) (2026-04-08)


### Bug Fixes

* select explícito en super-admin org detail para evitar error columnas nuevas ([2cad722](https://github.com/rkromero/SaaS-POS/commit/2cad7225c1b590315ca8dc1bc4c1b3247d25bc8d))

## [1.24.1](https://github.com/rkromero/SaaS-POS/compare/v1.24.0...v1.24.1) (2026-04-08)


### Bug Fixes

* mostrar error real en super admin orgs page para diagnóstico ([c19c803](https://github.com/rkromero/SaaS-POS/commit/c19c803ac690ebcc67ce1d05241570d60d705d96))
* select explícito en super-admin orgs para evitar error por columnas nuevas ([031a0b8](https://github.com/rkromero/SaaS-POS/commit/031a0b877bdff22c4d5983a230efa72f92a8399e))

# [1.24.0](https://github.com/rkromero/SaaS-POS/compare/v1.23.0...v1.24.0) (2026-04-08)


### Features

* módulo Control MP con OAuth de Mercado Pago ([aa8deed](https://github.com/rkromero/SaaS-POS/commit/aa8deed0658eb8680320a760a14cfec6783f5b24))

# [1.23.0](https://github.com/rkromero/SaaS-POS/compare/v1.22.2...v1.23.0) (2026-04-08)


### Features

* aplicar límites de plan en locales y ventas ([adbe071](https://github.com/rkromero/SaaS-POS/commit/adbe071e2706828c375f57335ab96eba37a46e9f))

## [1.22.2](https://github.com/rkromero/SaaS-POS/compare/v1.22.1...v1.22.2) (2026-04-08)


### Bug Fixes

* rediseño del tour con dos fases por paso ([43b12f6](https://github.com/rkromero/SaaS-POS/commit/43b12f62ac95795b650131d5696980184b3cdda0))

## [1.22.1](https://github.com/rkromero/SaaS-POS/compare/v1.22.0...v1.22.1) (2026-04-08)


### Bug Fixes

* ocultar checklist durante spotlight para no tapar los links del sidebar ([86ef339](https://github.com/rkromero/SaaS-POS/commit/86ef33926ee7db9fa9417739aee6e940200ed644))

# [1.22.0](https://github.com/rkromero/SaaS-POS/compare/v1.21.0...v1.22.0) (2026-04-08)


### Features

* sistema de onboarding guiado paso a paso ([5d04e0f](https://github.com/rkromero/SaaS-POS/commit/5d04e0fbe838935cab64b5733d7b96ca4b9806f3))

# [1.21.0](https://github.com/rkromero/SaaS-POS/compare/v1.20.3...v1.21.0) (2026-04-08)


### Features

* sistema de super admin con licencias becada y módulos por cliente ([09122bd](https://github.com/rkromero/SaaS-POS/commit/09122bdf3c96bdcfce8353e952b539a2d727c868))

## [1.20.3](https://github.com/rkromero/SaaS-POS/compare/v1.20.2...v1.20.3) (2026-04-08)


### Bug Fixes

* remover wrapper de debug de /api/caja/status ([86cdddf](https://github.com/rkromero/SaaS-POS/commit/86cdddf12204aa20ad25e117404e5b3b3e4fa612))

## [1.20.2](https://github.com/rkromero/SaaS-POS/compare/v1.20.1...v1.20.2) (2026-04-08)


### Bug Fixes

* capturar error interno en /api/caja/status para diagnóstico ([850f550](https://github.com/rkromero/SaaS-POS/commit/850f550f75769b090ac0711719034afc4fe9247f))

## [1.20.1](https://github.com/rkromero/SaaS-POS/compare/v1.20.0...v1.20.1) (2026-04-08)


### Bug Fixes

* agregar manejo de errores en loadStatus para evitar pantalla en blanco ([89e4780](https://github.com/rkromero/SaaS-POS/commit/89e4780495745a8c245a9a6852322f95a9e41502))

# [1.20.0](https://github.com/rkromero/SaaS-POS/compare/v1.19.4...v1.20.0) (2026-04-08)


### Features

* agregar posnet, mercadopago y plataforma de envíos a apertura/cierre de caja ([5dd9719](https://github.com/rkromero/SaaS-POS/commit/5dd971986abac7f9ba4704cf195abe9ddc084529))

## [1.19.4](https://github.com/rkromero/SaaS-POS/compare/v1.19.3...v1.19.4) (2026-04-08)


### Bug Fixes

* corregir apertura de caja para admins y agregar feedback de errores ([4ff768e](https://github.com/rkromero/SaaS-POS/commit/4ff768eeef36e5d93f8b7648b310486d6702f742))

## [1.19.3](https://github.com/rkromero/SaaS-POS/compare/v1.19.2...v1.19.3) (2026-04-07)


### Bug Fixes

* reemplazar paquete afip por cliente ARCA nativo sin templates EJS ([e551d3d](https://github.com/rkromero/SaaS-POS/commit/e551d3d535bf9341799c502323919e2157b50c1e))

## [1.19.2](https://github.com/rkromero/SaaS-POS/compare/v1.19.1...v1.19.2) (2026-04-07)


### Bug Fixes

* corregir templates afip en Vercel y validación wizard ARCA ([be83272](https://github.com/rkromero/SaaS-POS/commit/be83272142a2f2221c6e18f93b999eec5ecf8926))

## [1.19.1](https://github.com/rkromero/SaaS-POS/compare/v1.19.0...v1.19.1) (2026-04-07)


### Bug Fixes

* guard result undefined en arca config route ([de737fa](https://github.com/rkromero/SaaS-POS/commit/de737fa21806e18829ef6d4da47092b38bbce717))

# [1.19.0](https://github.com/rkromero/SaaS-POS/compare/v1.18.0...v1.19.0) (2026-04-07)


### Features

* integración ARCA facturación electrónica (wizard guiado + POS + ticket) ([1f253a2](https://github.com/rkromero/SaaS-POS/commit/1f253a2512d0055d61d9ecfa50aff4f8af70b8d2))

# [1.18.0](https://github.com/rkromero/SaaS-POS/compare/v1.17.2...v1.18.0) (2026-04-07)


### Features

* personalización de marca para planes de pago (logo, color, recibos) ([fb7cb59](https://github.com/rkromero/SaaS-POS/commit/fb7cb598a26f37939f342e020697615b2277818f))

## [1.17.2](https://github.com/rkromero/SaaS-POS/compare/v1.17.1...v1.17.2) (2026-04-07)


### Bug Fixes

* reemplazar OrganizationSwitcher por nombre estático de la org ([9fc3447](https://github.com/rkromero/SaaS-POS/commit/9fc3447845d16e49e542aa0d5e03b1a995a03953))

## [1.17.1](https://github.com/rkromero/SaaS-POS/compare/v1.17.0...v1.17.1) (2026-04-07)


### Bug Fixes

* usar fecha local en gastos (no UTC) ([b9d0aa8](https://github.com/rkromero/SaaS-POS/commit/b9d0aa8fc499876a970d56c3f704ce99fcb35894))

# [1.17.0](https://github.com/rkromero/SaaS-POS/compare/v1.16.0...v1.17.0) (2026-04-07)


### Features

* gastos diferenciados por local para admins ([650de88](https://github.com/rkromero/SaaS-POS/commit/650de88fa66a6dc39f611b7203140d4291fb3c3d))

# [1.16.0](https://github.com/rkromero/SaaS-POS/compare/v1.15.1...v1.16.0) (2026-04-07)


### Features

* fiado diferenciado por local para admins ([9f540c5](https://github.com/rkromero/SaaS-POS/commit/9f540c56073b8ea5ec733d9afcfd30332761a2d3))

## [1.15.1](https://github.com/rkromero/SaaS-POS/compare/v1.15.0...v1.15.1) (2026-04-07)


### Bug Fixes

* selector de local en stock solo visible para admins ([3a9fdbe](https://github.com/rkromero/SaaS-POS/commit/3a9fdbefad4d13ece6cc87f0e4bb959de3b739d0))

# [1.15.0](https://github.com/rkromero/SaaS-POS/compare/v1.14.6...v1.15.0) (2026-04-07)


### Features

* mostrar y seleccionar local en formulario de movimiento de stock ([67df5a9](https://github.com/rkromero/SaaS-POS/commit/67df5a98896441f34d0c6f8d75bbba1fafd85695))

## [1.14.6](https://github.com/rkromero/SaaS-POS/compare/v1.14.5...v1.14.6) (2026-04-07)


### Bug Fixes

* manejo de errores en API de productos ([33ec93f](https://github.com/rkromero/SaaS-POS/commit/33ec93f235718e910213daaaefce7e6ff3dd73f2))

## [1.14.5](https://github.com/rkromero/SaaS-POS/compare/v1.14.4...v1.14.5) (2026-04-07)


### Bug Fixes

* hacer opcionales vars de Stripe y Clerk sign-in URL en Env.ts ([4cff878](https://github.com/rkromero/SaaS-POS/commit/4cff878302b7fb0f85e5cd747781c2218a431cb4))

## [1.14.4](https://github.com/rkromero/SaaS-POS/compare/v1.14.3...v1.14.4) (2026-04-07)


### Bug Fixes

* usar URL pública de Railway para Vercel (no URL interna) ([b6deccf](https://github.com/rkromero/SaaS-POS/commit/b6deccf736eea79486b312ae436571400c63094f))

## [1.14.3](https://github.com/rkromero/SaaS-POS/compare/v1.14.2...v1.14.3) (2026-04-07)


### Bug Fixes

* corregir DATABASE_URL con contraseña correcta (W mayúscula) ([d6cc9e8](https://github.com/rkromero/SaaS-POS/commit/d6cc9e86bee103b65b6318303273a9298bb0087c))

## [1.14.2](https://github.com/rkromero/SaaS-POS/compare/v1.14.1...v1.14.2) (2026-04-07)


### Bug Fixes

* aislamiento de datos por local para usuarios miembro ([aac22d4](https://github.com/rkromero/SaaS-POS/commit/aac22d49663337b852ff97853961350673c9ca86))

## [1.14.1](https://github.com/rkromero/SaaS-POS/compare/v1.14.0...v1.14.1) (2026-04-07)


### Bug Fixes

* flujo de onboarding seguro y corrección de DATABASE_URL ([04ebce8](https://github.com/rkromero/SaaS-POS/commit/04ebce80ba8eb1dfa57b81cdf553a1aae19983be))

# [1.14.0](https://github.com/rkromero/SaaS-POS/compare/v1.13.0...v1.14.0) (2026-04-07)


### Features

* soporte completo de código de barras para POS y stock ([8f8e91f](https://github.com/rkromero/SaaS-POS/commit/8f8e91ff30c7e9cf4b07910ad53bb2de89d33f48))

# [1.13.0](https://github.com/rkromero/SaaS-POS/compare/v1.12.0...v1.13.0) (2026-04-07)


### Features

* aplicar manual de marca TuCaja al sistema (dashboard + auth) ([f9a92c3](https://github.com/rkromero/SaaS-POS/commit/f9a92c3bc087da8a387dd2fc60b7efa37a74baae)), closes [#1e7a35](https://github.com/rkromero/SaaS-POS/issues/1e7a35) [#faf8f3](https://github.com/rkromero/SaaS-POS/issues/faf8f3)

# [1.12.0](https://github.com/rkromero/SaaS-POS/compare/v1.11.0...v1.12.0) (2026-04-06)


### Features

* crear usuarios directamente desde el panel admin ([3d1e318](https://github.com/rkromero/SaaS-POS/commit/3d1e318b33673eb27e6dd063283f4a0e16b73310))

# [1.11.0](https://github.com/rkromero/SaaS-POS/compare/v1.10.3...v1.11.0) (2026-04-06)


### Features

* reemplazar landing page con diseño nuevo orientado a beneficios ([e12c6ee](https://github.com/rkromero/SaaS-POS/commit/e12c6ee4a48abb7a1762fc17aa10513e81e19ae5))

## [1.10.3](https://github.com/rkromero/SaaS-POS/compare/v1.10.2...v1.10.3) (2026-04-06)


### Performance Improvements

* cache HTTP en browser para productos y locales ([9ab9684](https://github.com/rkromero/SaaS-POS/commit/9ab968493f26a177167985a8f984d3e488a7dd60))

## [1.10.2](https://github.com/rkromero/SaaS-POS/compare/v1.10.1...v1.10.2) (2026-04-06)


### Performance Improvements

* reducir latencia con pool de conexiones y queries paralelas ([dacaca7](https://github.com/rkromero/SaaS-POS/commit/dacaca713ee35d3376abe1223890dba720dee564))

## [1.10.1](https://github.com/rkromero/SaaS-POS/compare/v1.10.0...v1.10.1) (2026-04-06)


### Bug Fixes

* cobro/fiado no se registraba para admin sin local asignado ([8305864](https://github.com/rkromero/SaaS-POS/commit/8305864ffde050b1afd59852b7cab17b2f9954b4))

# [1.10.0](https://github.com/rkromero/SaaS-POS/compare/v1.9.0...v1.10.0) (2026-04-06)


### Features

* alta de cliente en Fiado con WhatsApp obligatorio como identificador ([4c47bb3](https://github.com/rkromero/SaaS-POS/commit/4c47bb3227c39bbfd80d55529d652d80c4c77a5b))

# [1.9.0](https://github.com/rkromero/SaaS-POS/compare/v1.8.0...v1.9.0) (2026-04-06)


### Features

* pago por fiado en POS con búsqueda de cliente por WhatsApp ([041f76c](https://github.com/rkromero/SaaS-POS/commit/041f76cc9fdfe312e50c310ed2b26942885805be))

# [1.8.0](https://github.com/rkromero/SaaS-POS/compare/v1.7.1...v1.8.0) (2026-04-06)


### Features

* scanner, reports, expenses, csv import, pwa, whatsapp ([9c9d99a](https://github.com/rkromero/SaaS-POS/commit/9c9d99a2cdf5f3d1fd1f15cded591acfb409999e))

## [1.7.1](https://github.com/rkromero/SaaS-POS/compare/v1.7.0...v1.7.1) (2026-04-06)


### Performance Improvements

* add 20 database indexes across all tables ([fe410f9](https://github.com/rkromero/SaaS-POS/commit/fe410f9e0083216cdcc54f77164fba6cdf8d353a))

# [1.7.0](https://github.com/rkromero/SaaS-POS/compare/v1.6.0...v1.7.0) (2026-04-06)


### Features

* replace top nav with CRM-style sidebar ([50993c0](https://github.com/rkromero/SaaS-POS/commit/50993c036a936165d921d2ee6059a4313afd81ee))

# [1.6.0](https://github.com/rkromero/SaaS-POS/compare/v1.5.0...v1.6.0) (2026-04-06)


### Features

* kiosco features — fiado, caja, stock alerts, bulk prices, suppliers ([83688a6](https://github.com/rkromero/SaaS-POS/commit/83688a644c28999ea578279cd537befdc350c036))

# [1.5.0](https://github.com/rkromero/SaaS-POS/compare/v1.4.0...v1.5.0) (2026-04-06)


### Features

* add Mercado Pago billing module with plan management ([940f0d1](https://github.com/rkromero/SaaS-POS/commit/940f0d11289e639991808cc75bba0a45870ec401))

# [1.4.0](https://github.com/rkromero/SaaS-POS/compare/v1.3.0...v1.4.0) (2026-04-06)


### Features

* add dashboard metrics (KPIs, trend chart, top products, low stock) ([3234990](https://github.com/rkromero/SaaS-POS/commit/32349908d04877d988bb7c0ca97bedeea405c3db))

# [1.3.0](https://github.com/rkromero/SaaS-POS/compare/v1.2.0...v1.3.0) (2026-04-06)


### Features

* add user-location assignment (admin assigns members to locations) ([e7ec784](https://github.com/rkromero/SaaS-POS/commit/e7ec784385c1484135c4833f5c879b486dc30e98))

# [1.2.0](https://github.com/rkromero/SaaS-POS/compare/v1.1.2...v1.2.0) (2026-04-06)


### Features

* add sales history with detail and reprint ([af87d0c](https://github.com/rkromero/SaaS-POS/commit/af87d0c9b0fda05d77028cd158b692052b9382fc))

## [1.1.2](https://github.com/rkromero/SaaS-POS/compare/v1.1.1...v1.1.2) (2026-04-06)


### Bug Fixes

* show all products in stock page, not just those with movements ([76b5563](https://github.com/rkromero/SaaS-POS/commit/76b55633232161cefd87a95c68018359cf464f18))

## [1.1.1](https://github.com/rkromero/SaaS-POS/compare/v1.1.0...v1.1.1) (2026-04-05)


### Bug Fixes

* exclude API routes from i18n middleware to prevent 404s ([31f956a](https://github.com/rkromero/SaaS-POS/commit/31f956a6c285ba16764b6eeb793ce8859386ebd8))

# [1.1.0](https://github.com/rkromero/SaaS-POS/compare/v1.0.0...v1.1.0) (2026-04-05)


### Features

* add categories and products CRUD module ([271509b](https://github.com/rkromero/SaaS-POS/commit/271509b622929905009fa3f5fd1143682f322fc7))
* add locations CRUD module (API + UI) ([7ee9d2e](https://github.com/rkromero/SaaS-POS/commit/7ee9d2ea836b169123c60db9d54cae22263a8d7b))
* add POS screen with cart, checkout and printable ticket ([0186172](https://github.com/rkromero/SaaS-POS/commit/0186172bd97a50665d4acc83aff23f776f563a34))
* add stock management module (movements + history + low stock alerts) ([11df8ee](https://github.com/rkromero/SaaS-POS/commit/11df8eee4450d5a82420e3267da6011bc6f7ecc6))

# 1.0.0 (2026-04-05)


### Features

* initial commit - SaaS POS boilerplate ([ed894a5](https://github.com/rkromero/SaaS-POS/commit/ed894a580135969aaa2f6eb587afab9ea1656805))

## [1.7.7](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.6...v1.7.7) (2025-12-12)


### Bug Fixes

* update checkly.config.ts ([61424bf](https://github.com/ixartz/SaaS-Boilerplate/commit/61424bfa71764c08d349b7555c5f8696b070ffb5))

## [1.7.6](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.5...v1.7.6) (2025-05-01)


### Bug Fixes

* update clerk to the latest version and update middlware to use await with auth ([2287192](https://github.com/ixartz/SaaS-Boilerplate/commit/2287192ddcf5b27a1f43ac2b7a992e065b990627))

## [1.7.5](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.4...v1.7.5) (2025-05-01)


### Bug Fixes

* clerk integration ([a9981cd](https://github.com/ixartz/SaaS-Boilerplate/commit/a9981cddcb4a0e2365066938533cd13225ce10a9))

## [1.7.4](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.3...v1.7.4) (2024-12-20)


### Bug Fixes

* remove custom framework configuration for i18n-ally vscode ([63f87fe](https://github.com/ixartz/SaaS-Boilerplate/commit/63f87feb3c0cb186c500ef9bed9cb50d7309224d))
* use new vitest vscode setting for preventing automatic opening of the test results ([2a2b945](https://github.com/ixartz/SaaS-Boilerplate/commit/2a2b945050f8d19883d6f2a8a6ec5ccf8b1f4173))

## [1.7.3](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.2...v1.7.3) (2024-11-07)


### Bug Fixes

* chnage dashboard index message button in french translation ([2f1dca8](https://github.com/ixartz/SaaS-Boilerplate/commit/2f1dca84cb05af52a959dd9630769ed661d8c69b))
* remove update deps github workflow, add separator in dashboard header ([fcf0fb4](https://github.com/ixartz/SaaS-Boilerplate/commit/fcf0fb48304ce45f6ceefa7d7eae11692655c749))

## [1.7.2](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.1...v1.7.2) (2024-10-17)


### Bug Fixes

* hide text in logo used in dashboard and add spacing for sign in button used in navbar ([a0eeda1](https://github.com/ixartz/SaaS-Boilerplate/commit/a0eeda12251551fd6a8e50222f46f3d47f0daad7))
* in dashboard, make the logo smaller, display without text ([f780727](https://github.com/ixartz/SaaS-Boilerplate/commit/f780727659fa58bbe6e4250dd63b2819369b7308))
* remove hydration error and unify with pro version 1.6.1 ([ea2d02b](https://github.com/ixartz/SaaS-Boilerplate/commit/ea2d02bd52de34c6cd2390d160ffe7f14319d5c3))

## [1.7.1](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.7.0...v1.7.1) (2024-10-04)


### Bug Fixes

* update logicalId in checkly configuration ([6e7a479](https://github.com/ixartz/SaaS-Boilerplate/commit/6e7a4795bff0b92d3681fadc36256aa957eb2613))

# [1.7.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.6.1...v1.7.0) (2024-10-04)


### Features

* update de Next.js Boilerplate v3.58.1 ([16aea65](https://github.com/ixartz/SaaS-Boilerplate/commit/16aea651ef93ed627e3bf310412cfd3651aeb3e4))

## [1.6.1](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.6.0...v1.6.1) (2024-08-31)


### Bug Fixes

* add demo banner at the top of the landing page ([09bf8c8](https://github.com/ixartz/SaaS-Boilerplate/commit/09bf8c8aba06eba1405fb0c20aeec23dfb732bb7))
* issue to build Next.js with Node.js 22.7, use 22.6 instead ([4acaef9](https://github.com/ixartz/SaaS-Boilerplate/commit/4acaef95edec3cd72a35405969ece9d55a2bb641))

# [1.6.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.5.0...v1.6.0) (2024-07-26)


### Features

* update to Next.js Boilerpalte v3.54 ([ae80843](https://github.com/ixartz/SaaS-Boilerplate/commit/ae808433e50d6889559fff382d4b9c595d34e04f))

# [1.5.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.4.0...v1.5.0) (2024-06-05)


### Features

* update to Drizzle Kit 0.22, Storybook 8, migrate to vitest ([c2f19cd](https://github.com/ixartz/SaaS-Boilerplate/commit/c2f19cd8e9dc983e0ad799da2474610b57b88f50))

# [1.4.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.3.0...v1.4.0) (2024-05-17)


### Features

* vscode jest open test result view on test fails and add unauthenticatedUrl in clerk middleware ([3cfcb6b](https://github.com/ixartz/SaaS-Boilerplate/commit/3cfcb6b00d91dabcb00cbf8eb2d8be6533ff672e))

# [1.3.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.2.1...v1.3.0) (2024-05-16)


### Features

* add custom framework for i18n-ally and replace deprecated Jest VSCode configuration ([a9889dc](https://github.com/ixartz/SaaS-Boilerplate/commit/a9889dc129aeeba8801f4f47e54d46e9515e6a29))
* create dashboard header component ([f3dc1da](https://github.com/ixartz/SaaS-Boilerplate/commit/f3dc1da451ab8dce90d111fe4bbc8d4bc99e4b01))
* don't redirect to organization-selection if the user is already on this page ([87da997](https://github.com/ixartz/SaaS-Boilerplate/commit/87da997b853fd9dcb7992107d2cb206817258910))
* make the landing page responsive and works on mobile ([27e908a](https://github.com/ixartz/SaaS-Boilerplate/commit/27e908a735ea13845a6cc42acc12e6cae3232b9b))
* make user dashboard responsive ([f88c9dd](https://github.com/ixartz/SaaS-Boilerplate/commit/f88c9dd5ac51339d37d1d010e5b16c7776c73b8d))
* migreate Env.mjs file to Env.ts ([2e6ff12](https://github.com/ixartz/SaaS-Boilerplate/commit/2e6ff124dcc10a3c12cac672cbb82ec4000dc60c))
* remove next-sitemap and use the native Next.js sitemap/robots.txt ([75c9751](https://github.com/ixartz/SaaS-Boilerplate/commit/75c9751d607b8a6a269d08667f7d9900797ff38a))
* upgrade to Clerk v5 and use Clerk's Core 2 ([a92cef0](https://github.com/ixartz/SaaS-Boilerplate/commit/a92cef026b5c85a703f707aabf42d28a16f07054))
* use Node.js version 20 and 22 in GitHub Actions ([226b5e9](https://github.com/ixartz/SaaS-Boilerplate/commit/226b5e970f46bfcd384ca60cd63ebb15516eca21))

## [1.2.1](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.2.0...v1.2.1) (2024-03-30)


### Bug Fixes

* redirect user to the landing page after signing out ([6e9f383](https://github.com/ixartz/SaaS-Boilerplate/commit/6e9f3839daaab56dd3cf3e57287ea0f3862b8588))

# [1.2.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.1.0...v1.2.0) (2024-03-29)


### Features

* add link to the GitHub repository ([ed42176](https://github.com/ixartz/SaaS-Boilerplate/commit/ed42176bdc2776cacc2c939bac45914a1ede8e51))

# [1.1.0](https://github.com/ixartz/SaaS-Boilerplate/compare/v1.0.0...v1.1.0) (2024-03-29)


### Features

* launching SaaS boilerplate for helping developers to build SaaS quickly ([7f24661](https://github.com/ixartz/SaaS-Boilerplate/commit/7f246618791e3a731347dffc694a52fa90b1152a))

# 1.0.0 (2024-03-29)


### Features

* initial commit ([d58e1d9](https://github.com/ixartz/SaaS-Boilerplate/commit/d58e1d97e11baa0a756bd038332eb84daf5a8327))

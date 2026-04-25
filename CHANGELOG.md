## [1.70.4](https://github.com/rkromero/SaaS-POS/compare/v1.70.3...v1.70.4) (2026-04-25)


### Bug Fixes

* **arca:** decodificar HTML entities en respuesta WSAA ([ce2dc08](https://github.com/rkromero/SaaS-POS/commit/ce2dc08ba58c840d027df5ad90558601fbf72668))

## [1.70.3](https://github.com/rkromero/SaaS-POS/compare/v1.70.2...v1.70.3) (2026-04-25)


### Bug Fixes

* **arca:** soportar certificados DER y normalizar PEM ([24deb21](https://github.com/rkromero/SaaS-POS/commit/24deb21719638415ba13cbde8f1b706bf3054316))
* **arca:** usar UTC para generationTime en WSAA login ticket ([987fcd1](https://github.com/rkromero/SaaS-POS/commit/987fcd172021e4f4a13ba0495959af0a95aaa15a))

## [1.70.2](https://github.com/rkromero/SaaS-POS/compare/v1.70.1...v1.70.2) (2026-04-25)


### Bug Fixes

* **cron:** cambiar caja-autoclose a diario para plan Hobby de Vercel ([622fad8](https://github.com/rkromero/SaaS-POS/commit/622fad870892b64bad4c492e0254ca62086084ba))

## [1.70.1](https://github.com/rkromero/SaaS-POS/compare/v1.70.0...v1.70.1) (2026-04-25)


### Bug Fixes

* **arca:** usar OID directo para serialNumber en CSR ([dd65d5f](https://github.com/rkromero/SaaS-POS/commit/dd65d5f1b333930fcc004c97c3cb6c783aa5fee3))

# [1.70.0](https://github.com/rkromero/SaaS-POS/compare/v1.69.3...v1.70.0) (2026-04-25)


### Features

* **caja:** implementar apertura y cierre de caja por usuario con auto-cierre ([d5bee73](https://github.com/rkromero/SaaS-POS/commit/d5bee73b275c9cc592c595210030d5fba80e98c6))

## [1.69.3](https://github.com/rkromero/SaaS-POS/compare/v1.69.2...v1.69.3) (2026-04-24)


### Bug Fixes

* **arca:** wrappear generate-csr en try-catch y simplificar public key ([0792a02](https://github.com/rkromero/SaaS-POS/commit/0792a02424ea5dcd88eca0d15d75213dc9758fdd))
* **theme:** forzar tema claro por defecto al iniciar sesión ([8a5f243](https://github.com/rkromero/SaaS-POS/commit/8a5f243dcb187b0f321e2d227a3c830b3283f1e4))

## [1.69.2](https://github.com/rkromero/SaaS-POS/compare/v1.69.1...v1.69.2) (2026-04-23)


### Bug Fixes

* **arca:** reemplazar forge RSA gen por Node crypto nativo para evitar crash ([e60c14e](https://github.com/rkromero/SaaS-POS/commit/e60c14ed9a2538aa66dd721ecf43b9d8951d8df9))

## [1.69.1](https://github.com/rkromero/SaaS-POS/compare/v1.69.0...v1.69.1) (2026-04-23)


### Bug Fixes

* **arca:** corregir timeout en generate-csr por generación sincrónica RSA ([ae8b7f7](https://github.com/rkromero/SaaS-POS/commit/ae8b7f7710b241ba0c70a1706a863c71f7c43f74))

# [1.69.0](https://github.com/rkromero/SaaS-POS/compare/v1.68.1...v1.69.0) (2026-04-23)


### Features

* **arca:** generación automática de CSR para eliminar barrera técnica ([acfd459](https://github.com/rkromero/SaaS-POS/commit/acfd459267531967d800308ee92d8c3290ed7d45))

## [1.68.1](https://github.com/rkromero/SaaS-POS/compare/v1.68.0...v1.68.1) (2026-04-23)


### Bug Fixes

* **arca:** aclarar que personas físicas no necesitan Administrador de Relaciones ([6519c1b](https://github.com/rkromero/SaaS-POS/commit/6519c1b86a3bf544a42aec1739b9173513780fa2))
* **arca:** clarificar instrucciones del wizard de configuración ([7a8e3a5](https://github.com/rkromero/SaaS-POS/commit/7a8e3a58565d39eeefc7c9a0971d1a2a628b995c))
* **arca:** corregir nombre del servicio WSFE en la UI del portal ([0b8b8d1](https://github.com/rkromero/SaaS-POS/commit/0b8b8d103f9e612abb46f5ae7b7b35be05a034f0))
* **arca:** instrucciones exactas de navegación en portal ARCA ([93d9443](https://github.com/rkromero/SaaS-POS/commit/93d94434f4aef100e556555de702a67180f6125b))

# [1.68.0](https://github.com/rkromero/SaaS-POS/compare/v1.67.2...v1.68.0) (2026-04-23)


### Features

* **arca:** mejorar UX del wizard de configuración de facturación ([0f4f3be](https://github.com/rkromero/SaaS-POS/commit/0f4f3be3058f016697cf0ecc0750465432f68c91))

## [1.67.2](https://github.com/rkromero/SaaS-POS/compare/v1.67.1...v1.67.2) (2026-04-23)


### Bug Fixes

* **products:** escáner en formulario nuevo producto va a campo barcode ([c42950d](https://github.com/rkromero/SaaS-POS/commit/c42950d825e8a003ce02334995dde79a7d571dfd))

## [1.67.1](https://github.com/rkromero/SaaS-POS/compare/v1.67.0...v1.67.1) (2026-04-23)


### Bug Fixes

* **pos:** corregir detección de escáner en modal crear producto ([760c3df](https://github.com/rkromero/SaaS-POS/commit/760c3dfb615407dbb522d76b21cc0f7b43a82791))

# [1.67.0](https://github.com/rkromero/SaaS-POS/compare/v1.66.0...v1.67.0) (2026-04-23)


### Features

* **pos:** auto-completar nombre e imagen desde Open Food Facts al crear producto ([8400026](https://github.com/rkromero/SaaS-POS/commit/8400026146fab9694788fcf141fa3144c6f68c4d))

# [1.66.0](https://github.com/rkromero/SaaS-POS/compare/v1.65.2...v1.66.0) (2026-04-23)


### Features

* **pos:** producto no encontrado al escanear → dialog de creación rápida ([fb6b339](https://github.com/rkromero/SaaS-POS/commit/fb6b339fe7aa9a079dcd313f312b74e76a82ce41))

## [1.65.2](https://github.com/rkromero/SaaS-POS/compare/v1.65.1...v1.65.2) (2026-04-23)


### Bug Fixes

* **customers:** búsqueda de teléfono por substring en lugar de sufijo ([d2275c6](https://github.com/rkromero/SaaS-POS/commit/d2275c66dfc6bf51452a4c9caa4b723ea5560d5a))

## [1.65.1](https://github.com/rkromero/SaaS-POS/compare/v1.65.0...v1.65.1) (2026-04-23)


### Bug Fixes

* **customers:** búsqueda de nombre case-insensitive con ILIKE en PostgreSQL ([c387647](https://github.com/rkromero/SaaS-POS/commit/c3876471296dbf18ca04a1812dc8da8af3caa9db))

# [1.65.0](https://github.com/rkromero/SaaS-POS/compare/v1.64.0...v1.65.0) (2026-04-23)


### Features

* **pos:** selector de cliente con búsqueda por nombre/teléfono y creación rápida ([a6f3f18](https://github.com/rkromero/SaaS-POS/commit/a6f3f18a792eee0e0034185f6940db3538dd100c))

# [1.64.0](https://github.com/rkromero/SaaS-POS/compare/v1.63.0...v1.64.0) (2026-04-23)


### Bug Fixes

* **pos:** agregar margen izquierdo para evitar superposición con botón de colapso del sidebar ([cb585d2](https://github.com/rkromero/SaaS-POS/commit/cb585d2cfabaea88e973e9d79a04df7e5a79b968))


### Features

* **pos:** mover email/whatsapp al sticky bottom y eliminar métodos de pago del panel principal ([45be68a](https://github.com/rkromero/SaaS-POS/commit/45be68acb59da2ed9b4bbff391bddbf73e7e4460))

# [1.63.0](https://github.com/rkromero/SaaS-POS/compare/v1.62.1...v1.63.0) (2026-04-23)


### Bug Fixes

* **pos:** agregar separación entre barra de filtros y grid de productos ([e0cea2e](https://github.com/rkromero/SaaS-POS/commit/e0cea2e04500c2fe5a6714876b961441231ff5b0))
* **pos:** ampliar panel derecho de ticket de 360px a 420px ([01fc823](https://github.com/rkromero/SaaS-POS/commit/01fc82349dc6c3740c8f04b6e0f22ece384654eb))


### Features

* **pos:** reemplazar select nativos por DropdownMenu de Radix UI ([a24883b](https://github.com/rkromero/SaaS-POS/commit/a24883bb10b4b1838d66490dddcca04c17b70425))

## [1.62.1](https://github.com/rkromero/SaaS-POS/compare/v1.62.0...v1.62.1) (2026-04-23)


### Bug Fixes

* **pos:** eliminar controles de Lista de precio y Numeración obsoletos ([f0d6d07](https://github.com/rkromero/SaaS-POS/commit/f0d6d0766d87f6ad2421ff581bc7d806b3fb80c9))

# [1.62.0](https://github.com/rkromero/SaaS-POS/compare/v1.61.2...v1.62.0) (2026-04-23)


### Features

* **pos:** pestañas de ventas paralelas con navegación y cierre automático ([33b7be0](https://github.com/rkromero/SaaS-POS/commit/33b7be0a7e6acfbf197e3b7288d176335625953f))

## [1.61.2](https://github.com/rkromero/SaaS-POS/compare/v1.61.1...v1.61.2) (2026-04-23)


### Bug Fixes

* **pos:** tabs al fondo del viewport escapando el padding del dashboard ([f6faa2a](https://github.com/rkromero/SaaS-POS/commit/f6faa2ad063f5ab738741189ea44880683a21a96))

## [1.61.1](https://github.com/rkromero/SaaS-POS/compare/v1.61.0...v1.61.1) (2026-04-23)


### Bug Fixes

* **pos:** tabs pegadas al fondo de pantalla usando flex-1 + h-full ([bec5d33](https://github.com/rkromero/SaaS-POS/commit/bec5d33f69d08cb06faa06c8cfc0396a750cf81e))

# [1.61.0](https://github.com/rkromero/SaaS-POS/compare/v1.60.0...v1.61.0) (2026-04-23)


### Features

* **pos:** restructurar layout siguiendo distribución de POS de referencia ([304b6a9](https://github.com/rkromero/SaaS-POS/commit/304b6a92e22575d7e12170003e3b0b70d7e22dff))

# [1.60.0](https://github.com/rkromero/SaaS-POS/compare/v1.59.1...v1.60.0) (2026-04-23)


### Features

* **landing:** rediseño infográfico zigzag de dos secciones ([4aad690](https://github.com/rkromero/SaaS-POS/commit/4aad690a27e2b3b97842867cfcf438ed4f95e493))

## [1.59.1](https://github.com/rkromero/SaaS-POS/compare/v1.59.0...v1.59.1) (2026-04-23)


### Bug Fixes

* **pos:** borde input busqueda y color boton ABRIR POS ([20fce5c](https://github.com/rkromero/SaaS-POS/commit/20fce5c4c8ea357c9c363fe173411c111b39c9f4))

# [1.59.0](https://github.com/rkromero/SaaS-POS/compare/v1.58.0...v1.59.0) (2026-04-23)


### Features

* **settings:** mover idioma y modo oscuro a personalizacion, limpiar sidebar ([6c5767d](https://github.com/rkromero/SaaS-POS/commit/6c5767db7f923f2c0a443740a70b7e1d42829fd1))

# [1.58.0](https://github.com/rkromero/SaaS-POS/compare/v1.57.0...v1.58.0) (2026-04-22)


### Features

* **settings:** unificar configuracion en una pagina con tabs horizontales ([f674eb5](https://github.com/rkromero/SaaS-POS/commit/f674eb5a412922e86fe76adcd83772d2431c78c3))

# [1.57.0](https://github.com/rkromero/SaaS-POS/compare/v1.56.2...v1.57.0) (2026-04-22)


### Features

* **products:** asignacion masiva de categorias post-importacion ([95a86cb](https://github.com/rkromero/SaaS-POS/commit/95a86cb599c8bee7930e022d16b7f947980b8747))

## [1.56.2](https://github.com/rkromero/SaaS-POS/compare/v1.56.1...v1.56.2) (2026-04-22)


### Bug Fixes

* **promotions:** corregir posicion de bolita en toggle activo/acumulable ([db73e36](https://github.com/rkromero/SaaS-POS/commit/db73e36de00c0927bb00430969decaf70f969441))

## [1.56.1](https://github.com/rkromero/SaaS-POS/compare/v1.56.0...v1.56.1) (2026-04-22)


### Bug Fixes

* **promotions:** cambiar color de toggles activo/acumulable a azul primario ([3f5c275](https://github.com/rkromero/SaaS-POS/commit/3f5c27598e6db6c454bb7ad11334a7a8c2071c75))

# [1.56.0](https://github.com/rkromero/SaaS-POS/compare/v1.55.1...v1.56.0) (2026-04-22)


### Features

* **promotions:** límite de usos opcional por promoción ([f279084](https://github.com/rkromero/SaaS-POS/commit/f2790848d1aed10af5b57560047797de2f81530e))

## [1.55.1](https://github.com/rkromero/SaaS-POS/compare/v1.55.0...v1.55.1) (2026-04-22)


### Bug Fixes

* **arca:** crear tabla location_arca_config faltante y agregar try/catch al endpoint ([76c547f](https://github.com/rkromero/SaaS-POS/commit/76c547faf78b998c390156a49d7b8d2862fa4a2a))

# [1.55.0](https://github.com/rkromero/SaaS-POS/compare/v1.54.0...v1.55.0) (2026-04-22)


### Features

* **pos:** ventas offline con sync automático al recuperar conexión ([3e58755](https://github.com/rkromero/SaaS-POS/commit/3e587552f423ff95b816cd9846f313afe56232f8))

# [1.54.0](https://github.com/rkromero/SaaS-POS/compare/v1.53.0...v1.54.0) (2026-04-22)


### Features

* **locations:** agregar configuración fiscal por local en UI ([b0c4689](https://github.com/rkromero/SaaS-POS/commit/b0c4689d5a5a9f60b91a47ec8d4f767d4ad213ce))

# [1.53.0](https://github.com/rkromero/SaaS-POS/compare/v1.52.1...v1.53.0) (2026-04-22)


### Features

* **arca:** config fiscal por local con fallback a organización (Opción C) ([bd9cd30](https://github.com/rkromero/SaaS-POS/commit/bd9cd3030afe7e4e89acaaf944a25bf261d95f5d))

## [1.52.1](https://github.com/rkromero/SaaS-POS/compare/v1.52.0...v1.52.1) (2026-04-22)


### Bug Fixes

* **pwa:** corregir meta tag deprecated y crear íconos faltantes ([8b2d40a](https://github.com/rkromero/SaaS-POS/commit/8b2d40ae0df01e8e925b49646de4840dfa648907))

# [1.52.0](https://github.com/rkromero/SaaS-POS/compare/v1.51.0...v1.52.0) (2026-04-22)


### Features

* **pos:** limitar cantidad en carrito al stock disponible ([08aa725](https://github.com/rkromero/SaaS-POS/commit/08aa725d14e9422cad0e352fcdab631764489a33))

# [1.51.0](https://github.com/rkromero/SaaS-POS/compare/v1.50.0...v1.51.0) (2026-04-22)


### Features

* **caja:** agregar historial de cajas cerradas con detalle expandible ([d459c3b](https://github.com/rkromero/SaaS-POS/commit/d459c3be3d4f2f9edf65dfbf4ef67c7241579cc2))

# [1.50.0](https://github.com/rkromero/SaaS-POS/compare/v1.49.0...v1.50.0) (2026-04-21)


### Features

* **demo-badge:** cambiar botón flotante a "Abrir POS" con azul nimbo ([9fab6e1](https://github.com/rkromero/SaaS-POS/commit/9fab6e1f64ce3876096360719eefd52a2334788a))
* **sidebar:** estilo activo azul nimbo sólido con texto blanco ([c56ea4f](https://github.com/rkromero/SaaS-POS/commit/c56ea4f99bcf1a012600467b6b3da71f2915703e))

# [1.49.0](https://github.com/rkromero/SaaS-POS/compare/v1.48.0...v1.49.0) (2026-04-21)


### Features

* **sidebar:** cambiar indicador de módulo activo a recuadro azul nimbo ([884190b](https://github.com/rkromero/SaaS-POS/commit/884190b67d7e64c8ce224ab18e10b620e4ee342d))

# [1.48.0](https://github.com/rkromero/SaaS-POS/compare/v1.47.0...v1.48.0) (2026-04-21)


### Features

* **stock:** abrir modal de ingreso al escanear barcode con pistola lectora ([6898172](https://github.com/rkromero/SaaS-POS/commit/6898172b07086ba31512442df3324fa3c047368a))

# [1.47.0](https://github.com/rkromero/SaaS-POS/compare/v1.46.2...v1.47.0) (2026-04-21)


### Features

* **pos:** consulta de precio global con F10 ([bb2ecb5](https://github.com/rkromero/SaaS-POS/commit/bb2ecb5d6d3a5ca54a462272c2334e4437a2913e))

## [1.46.2](https://github.com/rkromero/SaaS-POS/compare/v1.46.1...v1.46.2) (2026-04-21)


### Bug Fixes

* **billing:** agregar payer_email al preapproval de MP usando email del usuario de Clerk ([e9c200d](https://github.com/rkromero/SaaS-POS/commit/e9c200d3a43f7eccd0f4e8b458a2d5e1d9b9553a))

## [1.46.1](https://github.com/rkromero/SaaS-POS/compare/v1.46.0...v1.46.1) (2026-04-21)


### Bug Fixes

* **billing:** omitir payer_email en preapproval para evitar error 3DS en sandbox ([e697225](https://github.com/rkromero/SaaS-POS/commit/e697225792bf6d27f7221e3a02caf8e2e8b73eac))


### Features

* **onboarding+products:** reposicionar modal paso 4 y agregar combobox de categorías ([3a6a029](https://github.com/rkromero/SaaS-POS/commit/3a6a029014bf06b086567c701f8cc7eb6fea7c73))

# [1.46.0](https://github.com/rkromero/SaaS-POS/compare/v1.45.0...v1.46.0) (2026-04-21)


### Features

* **landing:** reemplazar tabla antes/después por cards con flecha animada ([e393d5c](https://github.com/rkromero/SaaS-POS/commit/e393d5c3e3a6e921f731b269d58548a42d8151ba))

# [1.45.0](https://github.com/rkromero/SaaS-POS/compare/v1.44.0...v1.45.0) (2026-04-21)


### Features

* **auth:** personalizar página de login con diseño split screen Nimbo ([ba1b67e](https://github.com/rkromero/SaaS-POS/commit/ba1b67ea6e040b8638db2ba87863fff68fb0f037))

# [1.44.0](https://github.com/rkromero/SaaS-POS/compare/v1.43.0...v1.44.0) (2026-04-21)


### Features

* **landing:** aplicar Coinbase design system a landing page ([e37e562](https://github.com/rkromero/SaaS-POS/commit/e37e562264b3ef2d7ec8f43101c393550a7463ab)), closes [#0052](https://github.com/rkromero/SaaS-POS/issues/0052)

# [1.43.0](https://github.com/rkromero/SaaS-POS/compare/v1.42.0...v1.43.0) (2026-04-21)


### Features

* **rebrand:** renombrar app a Nimbo con design system Coinbase ([e1468a3](https://github.com/rkromero/SaaS-POS/commit/e1468a32d298ec73bb324d14b9b1c1e1e80ca56b)), closes [#0052](https://github.com/rkromero/SaaS-POS/issues/0052)

# [1.42.0](https://github.com/rkromero/SaaS-POS/compare/v1.41.1...v1.42.0) (2026-04-21)


### Features

* **billing:** sistema de suscripciones recurrentes completo ([bb848c0](https://github.com/rkromero/SaaS-POS/commit/bb848c05237b21675b286de40508d21ea6ac6efb))

## [1.41.1](https://github.com/rkromero/SaaS-POS/compare/v1.41.0...v1.41.1) (2026-04-19)


### Bug Fixes

* **promotions:** migrar clases zinc hardcodeadas a variables semánticas de tema ([c241cdc](https://github.com/rkromero/SaaS-POS/commit/c241cdcf57374fe7266370cc8afac06756273e87))

# [1.41.0](https://github.com/rkromero/SaaS-POS/compare/v1.40.0...v1.41.0) (2026-04-19)


### Features

* **promotions:** rediseño completo de UX y look & feel ([f19800e](https://github.com/rkromero/SaaS-POS/commit/f19800e68e57dc16df54acefe4e36af502a1d0d2))

# [1.40.0](https://github.com/rkromero/SaaS-POS/compare/v1.39.2...v1.40.0) (2026-04-18)


### Features

* **ui:** agregar toggle de modo oscuro/claro en sidebar ([1ca82a9](https://github.com/rkromero/SaaS-POS/commit/1ca82a9bb96e99a54a86ae9388e53a308b9e4841))

## [1.39.2](https://github.com/rkromero/SaaS-POS/compare/v1.39.1...v1.39.2) (2026-04-17)


### Bug Fixes

* **ticket:** escape cierra el modal e inicia nueva venta ([e058c16](https://github.com/rkromero/SaaS-POS/commit/e058c1684a13d43ded4593ef3f1832af372b4dff))

## [1.39.1](https://github.com/rkromero/SaaS-POS/compare/v1.39.0...v1.39.1) (2026-04-17)


### Bug Fixes

* **pos:** conectar cliente de Modal 1 con validación de Fiado en checkout ([178d7ca](https://github.com/rkromero/SaaS-POS/commit/178d7caec42d85e02321745dc523a625950bdef9))

# [1.39.0](https://github.com/rkromero/SaaS-POS/compare/v1.38.4...v1.39.0) (2026-04-17)


### Features

* **pos:** flujo de cobro con modales secuenciales activado por doble Enter ([f4d1784](https://github.com/rkromero/SaaS-POS/commit/f4d17849a95e8bdbdac48442e81bb763c0912a3b))

## [1.38.4](https://github.com/rkromero/SaaS-POS/compare/v1.38.3...v1.38.4) (2026-04-17)


### Bug Fixes

* **expiration:** filtro 'Todos' muestra todos los lotes sin límite de fecha ([9dc2e72](https://github.com/rkromero/SaaS-POS/commit/9dc2e729a95012f9439a5aff09c7c0b213899792))
* **stock:** fefo al vender desde el POS y al registrar egresos manuales ([a1e2b96](https://github.com/rkromero/SaaS-POS/commit/a1e2b966e2129389b2ba0bff06a3be913d78d652))

## [1.38.3](https://github.com/rkromero/SaaS-POS/compare/v1.38.2...v1.38.3) (2026-04-17)


### Bug Fixes

* **expiration:** envolver todas las queries en try/catch para exponer el error real ([df4ed2d](https://github.com/rkromero/SaaS-POS/commit/df4ed2db08ab731cd6b430d19399bda1344ce85a))
* **expiration:** usar strings ISO para comparar fechas y agregar try/catch en query ([65ede54](https://github.com/rkromero/SaaS-POS/commit/65ede547b0bd1f3a450a0c7e165bf976def259ff))

## [1.38.2](https://github.com/rkromero/SaaS-POS/compare/v1.38.1...v1.38.2) (2026-04-17)


### Bug Fixes

* **expiration:** reemplazar raw SQL por operadores Drizzle tipados y mejorar error handling ([949e5af](https://github.com/rkromero/SaaS-POS/commit/949e5af1923300a85aeae8628aa85f16e303c372))

## [1.38.1](https://github.com/rkromero/SaaS-POS/compare/v1.38.0...v1.38.1) (2026-04-17)


### Bug Fixes

* **super-admin:** remover restricción de plan en activación de módulos ([fa30d4d](https://github.com/rkromero/SaaS-POS/commit/fa30d4d1c4870b5e73ae23366b60b5e821c8645b))

# [1.38.0](https://github.com/rkromero/SaaS-POS/compare/v1.37.0...v1.38.0) (2026-04-17)


### Features

* **stock:** conectar hasExpirationModule a StockList y StockMovementForm ([6b9c913](https://github.com/rkromero/SaaS-POS/commit/6b9c91394f73ea8a677d0eba81323b22867bded6))
* **stock:** módulo de control de vencimientos con FEFO y alertas ([4f3fb08](https://github.com/rkromero/SaaS-POS/commit/4f3fb0874e7762cc91d77df06a0618de3e5b5bc0))

# [1.37.0](https://github.com/rkromero/SaaS-POS/compare/v1.36.1...v1.37.0) (2026-04-17)


### Features

* **pos:** doble Enter global confirma venta independiente del foco ([a32d255](https://github.com/rkromero/SaaS-POS/commit/a32d255b5fc8ca3bc730ba538521a88c0f42c62a))

## [1.36.1](https://github.com/rkromero/SaaS-POS/compare/v1.36.0...v1.36.1) (2026-04-17)


### Bug Fixes

* **sales:** capturar y exponer error interno en POST /api/sales ([eea5a5a](https://github.com/rkromero/SaaS-POS/commit/eea5a5a6022a3e3b9a462a2352c81bc8b25a9ca4))

# [1.36.0](https://github.com/rkromero/SaaS-POS/compare/v1.35.0...v1.36.0) (2026-04-17)


### Features

* **pos:** doble Enter en búsqueda confirma la venta ([8f952cd](https://github.com/rkromero/SaaS-POS/commit/8f952cd5851805dec025c3f1aea4724bd0333985))

# [1.35.0](https://github.com/rkromero/SaaS-POS/compare/v1.34.0...v1.35.0) (2026-04-17)


### Features

* **pos:** combos visibles directamente en el grid de productos ([c1636b7](https://github.com/rkromero/SaaS-POS/commit/c1636b71e725df5394ecc66868f223cc73bd171b))

# [1.34.0](https://github.com/rkromero/SaaS-POS/compare/v1.33.1...v1.34.0) (2026-04-17)


### Features

* **promotions:** módulo completo de promociones y combos ([f69d0c7](https://github.com/rkromero/SaaS-POS/commit/f69d0c778bd24d1ca5aea39cb9b8b20ea0b69a22))

## [1.33.1](https://github.com/rkromero/SaaS-POS/compare/v1.33.0...v1.33.1) (2026-04-17)


### Bug Fixes

* **loyalty:** limpiar migración — eliminar sentencias de migraciones anteriores ya aplicadas ([89c372d](https://github.com/rkromero/SaaS-POS/commit/89c372df7fecb476da8052c6eaffba8b8e3e20ca))

# [1.33.0](https://github.com/rkromero/SaaS-POS/compare/v1.32.0...v1.33.0) (2026-04-17)


### Features

* **loyalty:** módulo completo de fidelización de clientes ([8118cca](https://github.com/rkromero/SaaS-POS/commit/8118ccaa823bb102f36d94d9a7c85b92e112a429))

# [1.32.0](https://github.com/rkromero/SaaS-POS/compare/v1.31.3...v1.32.0) (2026-04-16)


### Features

* **arca:** gate facturación ARCA a plan Pro/Empresa con override super admin ([aa5e6d5](https://github.com/rkromero/SaaS-POS/commit/aa5e6d5e24ed6c60a797814a10a6cad65a4c2dbc))

## [1.31.3](https://github.com/rkromero/SaaS-POS/compare/v1.31.2...v1.31.3) (2026-04-16)


### Bug Fixes

* **landing:** rediseño profesional de sección antes/después sin emojis ([69bf01d](https://github.com/rkromero/SaaS-POS/commit/69bf01deb88d95390762e321b4b6acd3fa020fba))

## [1.31.2](https://github.com/rkromero/SaaS-POS/compare/v1.31.1...v1.31.2) (2026-04-15)


### Bug Fixes

* **design:** scrollbar del sidebar integrada a la estética navy ([9dab4a3](https://github.com/rkromero/SaaS-POS/commit/9dab4a35b28873778b69868439ae519a217730e9))

## [1.31.1](https://github.com/rkromero/SaaS-POS/compare/v1.31.0...v1.31.1) (2026-04-15)


### Bug Fixes

* **design:** sidebar dark armonioso — CSS vars scoped + tipografía limpia ([fa0df85](https://github.com/rkromero/SaaS-POS/commit/fa0df858d6284da505721c82f4c81c99daa80cff))

# [1.31.0](https://github.com/rkromero/SaaS-POS/compare/v1.30.0...v1.31.0) (2026-04-15)


### Features

* **design:** sidebar navy oscuro + tipografía Lora en títulos ([6bed6c0](https://github.com/rkromero/SaaS-POS/commit/6bed6c054e64769c7decdf6e4846baf3426cb84d)), closes [#0f172](https://github.com/rkromero/SaaS-POS/issues/0f172)

# [1.30.0](https://github.com/rkromero/SaaS-POS/compare/v1.29.0...v1.30.0) (2026-04-15)


### Features

* **design:** aplica paleta navy+esmeralda al SaaS completo ([a33c4b8](https://github.com/rkromero/SaaS-POS/commit/a33c4b85115e3df5889ed63318c2c908a4934352)), closes [#059669](https://github.com/rkromero/SaaS-POS/issues/059669) [#f8](https://github.com/rkromero/SaaS-POS/issues/f8) [#0f172](https://github.com/rkromero/SaaS-POS/issues/0f172)

# [1.29.0](https://github.com/rkromero/SaaS-POS/compare/v1.28.0...v1.29.0) (2026-04-15)


### Features

* **landing:** rediseño paleta navy+esmeralda y fix OAuth MP ([5ce5b06](https://github.com/rkromero/SaaS-POS/commit/5ce5b06fde1db61f6171c39f59b07939206223ed))

# [1.28.0](https://github.com/rkromero/SaaS-POS/compare/v1.27.0...v1.28.0) (2026-04-15)


### Features

* **sidebar:** pestaña de colapso rectangular estilo fichero ([f075d62](https://github.com/rkromero/SaaS-POS/commit/f075d62d1a064a1bfbbbfa0c7cd4c6249c9c6935))

# [1.27.0](https://github.com/rkromero/SaaS-POS/compare/v1.26.0...v1.27.0) (2026-04-15)


### Features

* **sidebar:** sidebar colapsable con pestaña en el borde ([c7006c1](https://github.com/rkromero/SaaS-POS/commit/c7006c11968ac34d6b0a6c666d3151764c0e66e1))

# [1.26.0](https://github.com/rkromero/SaaS-POS/compare/v1.25.0...v1.26.0) (2026-04-15)


### Features

* **pos:** pantalla completa y imagen en tarjetas de productos ([dd257a5](https://github.com/rkromero/SaaS-POS/commit/dd257a584d36796d54d7e7a084882e13730db05a))

# [1.25.0](https://github.com/rkromero/SaaS-POS/compare/v1.24.8...v1.25.0) (2026-04-14)


### Features

* imagen de productos con upload a Cloudinary y auto-fetch por código de barras ([809c568](https://github.com/rkromero/SaaS-POS/commit/809c568265b3c83367947fe0afb2c57fcde68417))

## [1.24.8](https://github.com/rkromero/SaaS-POS/compare/v1.24.7...v1.24.8) (2026-04-10)


### Bug Fixes

* excluir rutas /api del auth.protect en middleware ([2ecb023](https://github.com/rkromero/SaaS-POS/commit/2ecb023f552826511caa57316263f56048ae33d2))

## [1.24.7](https://github.com/rkromero/SaaS-POS/compare/v1.24.6...v1.24.7) (2026-04-10)


### Bug Fixes

* capturar error real en POST /modules para diagnosticar 500 ([5917b18](https://github.com/rkromero/SaaS-POS/commit/5917b18f640d9488edfda58c9e59a2b084087ee8))

## [1.24.6](https://github.com/rkromero/SaaS-POS/compare/v1.24.5...v1.24.6) (2026-04-10)


### Bug Fixes

* upsert org antes de activar módulo desde super-admin ([f1a9871](https://github.com/rkromero/SaaS-POS/commit/f1a987180c00c2f5a9814689ac0f9aa70bf2f8db))

## [1.24.5](https://github.com/rkromero/SaaS-POS/compare/v1.24.4...v1.24.5) (2026-04-10)


### Bug Fixes

* agregar scope read/write/offline_access en OAuth connect de MP ([c1309e7](https://github.com/rkromero/SaaS-POS/commit/c1309e763a187890e9a6a7b271ba390f53bab885))

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

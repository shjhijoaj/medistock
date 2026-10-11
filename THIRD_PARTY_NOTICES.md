# Third-party notices

Project author: Hao Song. The project is independently implemented and is not a fork of jshERP. jshERP (Apache-2.0) was read as a business design reference; its source code is not included.

Frontend dependencies included in production bundles:

| Package | Version | License | Source |
| --- | --- | --- | --- |
| Vue | 2.7.16 | MIT | https://github.com/vuejs/vue |
| Vuex | 3.6.2 | MIT | https://github.com/vuejs/vuex |
| Vue Router | 3.6.5 | MIT | https://github.com/vuejs/vue-router |
| Element UI | 2.15.14 | MIT | https://github.com/ElemeFE/element |
| ECharts | 5.6.0 | Apache-2.0 | https://github.com/apache/echarts |
| zrender | dependency of ECharts | BSD-3-Clause | https://github.com/ecomfe/zrender |

Bundled Node.js Windows x64 runtime: version 24.19.0. Its full license, including bundled components, is in `runtime/NODE_LICENSE.txt` in the portable release.

License texts for frontend direct/transitive packages are copied into `licenses/`. Development tooling and its licenses remain in `node_modules` after `npm ci`. Dependency resolution is locked in `package-lock.json`.

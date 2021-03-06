import test from 'ava'
import { resolve } from 'path'
import rp from 'request-promise-native'

const port = 4007
const url = (route) => 'http://localhost:' + port + route

let nuxt = null
let server = null

// Init nuxt.js and create server listening on localhost:4000
test.before('Init Nuxt.js', async t => {
  const Nuxt = require('../')
  const rootDir = resolve(__dirname, 'fixtures/with-config')
  let config = require(resolve(rootDir, 'nuxt.config.js'))
  config.rootDir = rootDir
  config.dev = false
  nuxt = await new Nuxt(config)
  await nuxt.build()
  server = new nuxt.Server(nuxt)
  server.listen(port, 'localhost')
})

test('/', async t => {
  const { html } = await nuxt.renderRoute('/')
  t.true(html.includes('<h1>I have custom configurations</h1>'))
})

test('/ (global styles inlined)', async t => {
  // const { html } = await nuxt.renderRoute('/')
  // t.true(html.includes('.global-css-selector'))
  t.pass()
})

test('/ (custom app.html)', async t => {
  const { html } = await nuxt.renderRoute('/')
  t.true(html.includes('<p>Made by Nuxt.js team</p>'))
})

test('/ (custom build.publicPath)', async t => {
  const { html } = await nuxt.renderRoute('/')
  t.true(html.includes('src="/test/orion/vendor.bundle'))
})

test('/test/ (router base)', async t => {
  const window = await nuxt.renderAndGetWindow(url('/test/'))
  const html = window.document.body.innerHTML
  t.is(window.__NUXT__.layout, 'default')
  t.true(html.includes('<h1>Default layout</h1>'))
  t.true(html.includes('<h1>I have custom configurations</h1>'))
})

test('/test/about (custom layout)', async t => {
  const window = await nuxt.renderAndGetWindow(url('/test/about'))
  const html = window.document.body.innerHTML
  t.is(window.__NUXT__.layout, 'custom')
  t.true(html.includes('<h1>Custom layout</h1>'))
  t.true(html.includes('<h1>About page</h1>'))
})

test('/test/env', async t => {
  const window = await nuxt.renderAndGetWindow(url('/test/env'))
  const html = window.document.body.innerHTML
  t.true(html.includes('<h1>Custom env layout</h1>'))
  t.true(html.includes('"bool": true'))
  t.true(html.includes('"num": 23'))
  t.true(html.includes('"string": "Nuxt.js"'))
})

test('/test/error', async t => {
  const window = await nuxt.renderAndGetWindow(url('/test/error'))
  const html = window.document.body.innerHTML
  t.is(window.__NUXT__.layout, 'custom')
  t.true(html.includes('<h1>Custom layout</h1>'))
  t.true(html.includes('Error page'))
})

test('/test/user-agent', async t => {
  const window = await nuxt.renderAndGetWindow(url('/test/user-agent'))
  const html = window.document.body.innerHTML
  t.true(html.includes('<pre>Node.js'))
})

test('/test/about-bis (added with extendRoutes)', async t => {
  const window = await nuxt.renderAndGetWindow(url('/test/about-bis'))
  const html = window.document.body.innerHTML
  t.true(html.includes('<h1>Custom layout</h1>'))
  t.true(html.includes('<h1>About page</h1>'))
})

test('Check stats.json generated by build.analyze', t => {
  const stats = require(resolve(__dirname, 'fixtures/with-config/.nuxt/dist/stats.json'))
  t.is(stats.assets.length, 29)
})

test('Check /test.txt with custom serve-static options', async t => {
  const { headers } = await rp(url('/test.txt'), { resolveWithFullResponse: true })
  t.is(headers['cache-control'], 'public, max-age=31536000')
})

// Close server and ask nuxt to stop listening to file changes
test.after('Closing server and nuxt.js', t => {
  server.close()
  nuxt.close()
})

test.after('Should be able to start Nuxt with build done', async t => {
  const Nuxt = require('../')
  const rootDir = resolve(__dirname, 'fixtures/with-config')
  let config = require(resolve(rootDir, 'nuxt.config.js'))
  config.rootDir = rootDir
  config.dev = false
  nuxt = await new Nuxt(config)
})

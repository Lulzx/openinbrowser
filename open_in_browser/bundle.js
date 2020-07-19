
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* node_modules\smelte\src\components\Icon\Icon.svelte generated by Svelte v3.24.0 */

    const file = "node_modules\\smelte\\src\\components\\Icon\\Icon.svelte";

    function create_fragment(ctx) {
    	let i;
    	let i_class_value;
    	let i_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			i = element("i");
    			if (default_slot) default_slot.c();
    			attr_dev(i, "aria-hidden", "true");
    			attr_dev(i, "class", i_class_value = "material-icons icon text-xl " + /*$$props*/ ctx[5].class + " duration-200 ease-in" + " svelte-zzky5a");
    			attr_dev(i, "style", i_style_value = /*color*/ ctx[4] ? `color: ${/*color*/ ctx[4]}` : "");
    			toggle_class(i, "reverse", /*reverse*/ ctx[2]);
    			toggle_class(i, "tip", /*tip*/ ctx[3]);
    			toggle_class(i, "text-base", /*small*/ ctx[0]);
    			toggle_class(i, "text-xs", /*xs*/ ctx[1]);
    			add_location(i, file, 20, 0, 273);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (default_slot) {
    				default_slot.m(i, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*$$props*/ 32 && i_class_value !== (i_class_value = "material-icons icon text-xl " + /*$$props*/ ctx[5].class + " duration-200 ease-in" + " svelte-zzky5a")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (!current || dirty & /*color*/ 16 && i_style_value !== (i_style_value = /*color*/ ctx[4] ? `color: ${/*color*/ ctx[4]}` : "")) {
    				attr_dev(i, "style", i_style_value);
    			}

    			if (dirty & /*$$props, reverse*/ 36) {
    				toggle_class(i, "reverse", /*reverse*/ ctx[2]);
    			}

    			if (dirty & /*$$props, tip*/ 40) {
    				toggle_class(i, "tip", /*tip*/ ctx[3]);
    			}

    			if (dirty & /*$$props, small*/ 33) {
    				toggle_class(i, "text-base", /*small*/ ctx[0]);
    			}

    			if (dirty & /*$$props, xs*/ 34) {
    				toggle_class(i, "text-xs", /*xs*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { small = false } = $$props;
    	let { xs = false } = $$props;
    	let { reverse = false } = $$props;
    	let { tip = false } = $$props;
    	let { color = "default" } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Icon", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("small" in $$new_props) $$invalidate(0, small = $$new_props.small);
    		if ("xs" in $$new_props) $$invalidate(1, xs = $$new_props.xs);
    		if ("reverse" in $$new_props) $$invalidate(2, reverse = $$new_props.reverse);
    		if ("tip" in $$new_props) $$invalidate(3, tip = $$new_props.tip);
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ small, xs, reverse, tip, color });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("small" in $$props) $$invalidate(0, small = $$new_props.small);
    		if ("xs" in $$props) $$invalidate(1, xs = $$new_props.xs);
    		if ("reverse" in $$props) $$invalidate(2, reverse = $$new_props.reverse);
    		if ("tip" in $$props) $$invalidate(3, tip = $$new_props.tip);
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [small, xs, reverse, tip, color, $$props, $$scope, $$slots, click_handler];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			small: 0,
    			xs: 1,
    			reverse: 2,
    			tip: 3,
    			color: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get small() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reverse() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reverse(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tip() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tip(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const noDepth = ["white", "black", "transparent"];

    function getClass(prop, color, depth, defaultDepth) {
      if (noDepth.includes(color)) {
        return `${prop}-${color}`;
      }
      return `${prop}-${color}-${depth || defaultDepth} `;
    }

    function utils(color, defaultDepth = 500) {
      return {
        bg: depth => getClass("bg", color, depth, defaultDepth),
        border: depth => getClass("border", color, depth, defaultDepth),
        txt: depth => getClass("text", color, depth, defaultDepth),
        caret: depth => getClass("caret", color, depth, defaultDepth)
      };
    }

    class ClassBuilder {
      constructor(classes, defaultClasses) {
        this.defaults =
          (typeof classes === "function" ? classes(defaultClasses) : classes) ||
          defaultClasses;

        this.classes = this.defaults;
      }

      flush() {
        this.classes = this.defaults;

        return this;
      }

      extend(...fns) {
        return this;
      }

      get() {
        return this.classes;
      }

      replace(classes, cond = true) {
        if (cond && classes) {
          this.classes = Object.keys(classes).reduce(
            (acc, from) => acc.replace(new RegExp(from, "g"), classes[from]),
            this.classes
          );
        }

        return this;
      }

      remove(classes, cond = true) {
        if (cond && classes) {
          this.classes = classes
            .split(" ")
            .reduce(
              (acc, cur) => acc.replace(new RegExp(cur, "g"), ""),
              this.classes
            );
        }

        return this;
      }

      add(className, cond = true, defaultValue) {
        if (!cond || !className) return this;

        switch (typeof className) {
          case "string":
          default:
            this.classes += ` ${className} `;
            return this;
          case "function":
            this.classes += ` ${className(defaultValue || this.classes)} `;
            return this;
        }
      }
    }

    function filterProps(reserved, props) {

      return Object.keys(props).reduce(
        (acc, cur) =>
          cur.includes("$$") || cur.includes("Class") || reserved.includes(cur)
            ? acc
            : { ...acc, [cur]: props[cur] },
        {}
      );
    }

    // Thanks Lagden! https://svelte.dev/repl/61d9178d2b9944f2aa2bfe31612ab09f?version=3.6.7
    function ripple(color, centered) {
      return function(event) {
        const target = event.currentTarget;
        const circle = document.createElement("span");
        const d = Math.max(target.clientWidth, target.clientHeight);

        const removeCircle = () => {
          circle.remove();
          circle.removeEventListener("animationend", removeCircle);
        };

        circle.addEventListener("animationend", removeCircle);
        circle.style.width = circle.style.height = `${d}px`;
        const rect = target.getBoundingClientRect();

        if (centered) {
          circle.classList.add(
            "absolute",
            "top-0",
            "left-0",
            "ripple-centered",
            `bg-${color}-transDark`
          );
        } else {
          circle.style.left = `${event.clientX - rect.left - d / 2}px`;
          circle.style.top = `${event.clientY - rect.top - d / 2}px`;

          circle.classList.add("ripple-normal", `bg-${color}-trans`);
        }

        circle.classList.add("ripple");

        target.appendChild(circle);
      };
    }

    function r(color = "primary", centered = false) {
      return function(node) {
        node.addEventListener("click", ripple(color, centered));

        return {
          onDestroy: () => node.removeEventListener("click")
        };
      };
    }

    /* node_modules\smelte\src\components\Button\Button.svelte generated by Svelte v3.24.0 */
    const file$1 = "node_modules\\smelte\\src\\components\\Button\\Button.svelte";

    // (150:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t;
    	let ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*icon*/ ctx[3] && create_if_block_2(ctx);
    	const default_slot_template = /*$$slots*/ ctx[29].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[38], null);

    	let button_levels = [
    		{ class: /*classes*/ ctx[1] },
    		/*props*/ ctx[8],
    		{ disabled: /*disabled*/ ctx[2] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$1, 150, 2, 4051);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(ripple_action = /*ripple*/ ctx[7].call(null, button)),
    					listen_dev(button, "click", /*click_handler_3*/ ctx[37], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[33], false, false, false),
    					listen_dev(button, "mouseover", /*mouseover_handler_1*/ ctx[34], false, false, false),
    					listen_dev(button, "*", /*_handler_1*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*icon*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty[1] & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[38], dirty, null, null);
    				}
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				(!current || dirty[0] & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
    				/*props*/ ctx[8],
    				(!current || dirty[0] & /*disabled*/ 4) && { disabled: /*disabled*/ ctx[2] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block.name,
    		type: "else",
    		source: "(150:0) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (129:0) {#if href}
    function create_if_block(ctx) {
    	let a;
    	let button;
    	let t;
    	let ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*icon*/ ctx[3] && create_if_block_1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[29].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[38], null);

    	let button_levels = [
    		{ class: /*classes*/ ctx[1] },
    		/*props*/ ctx[8],
    		{ disabled: /*disabled*/ ctx[2] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	let a_levels = [{ href: /*href*/ ctx[5] }, /*props*/ ctx[8]];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			a = element("a");
    			button = element("button");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$1, 133, 4, 3751);
    			set_attributes(a, a_data);
    			add_location(a, file$1, 129, 2, 3714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, button);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(ripple_action = /*ripple*/ ctx[7].call(null, button)),
    					listen_dev(button, "click", /*click_handler_2*/ ctx[36], false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[30], false, false, false),
    					listen_dev(button, "mouseover", /*mouseover_handler*/ ctx[31], false, false, false),
    					listen_dev(button, "*", /*_handler*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*icon*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty[1] & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[38], dirty, null, null);
    				}
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				(!current || dirty[0] & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
    				/*props*/ ctx[8],
    				(!current || dirty[0] & /*disabled*/ 4) && { disabled: /*disabled*/ ctx[2] }
    			]));

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty[0] & /*href*/ 32) && { href: /*href*/ ctx[5] },
    				/*props*/ ctx[8]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block.name,
    		type: "if",
    		source: "(129:0) {#if href}",
    		ctx
    	});

    	return block_1;
    }

    // (161:4) {#if icon}
    function create_if_block_2(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				class: /*iClasses*/ ctx[6],
    				small: /*small*/ ctx[4],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block_1 = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iClasses*/ 64) icon_1_changes.class = /*iClasses*/ ctx[6];
    			if (dirty[0] & /*small*/ 16) icon_1_changes.small = /*small*/ ctx[4];

    			if (dirty[0] & /*icon*/ 8 | dirty[1] & /*$$scope*/ 128) {
    				icon_1_changes.$$scope = { dirty, ctx };
    			}

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(161:4) {#if icon}",
    		ctx
    	});

    	return block_1;
    }

    // (162:6) <Icon class={iClasses} {small}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*icon*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*icon*/ 8) set_data_dev(t, /*icon*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(162:6) <Icon class={iClasses} {small}>",
    		ctx
    	});

    	return block_1;
    }

    // (144:6) {#if icon}
    function create_if_block_1(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				class: /*iClasses*/ ctx[6],
    				small: /*small*/ ctx[4],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block_1 = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iClasses*/ 64) icon_1_changes.class = /*iClasses*/ ctx[6];
    			if (dirty[0] & /*small*/ 16) icon_1_changes.small = /*small*/ ctx[4];

    			if (dirty[0] & /*icon*/ 8 | dirty[1] & /*$$scope*/ 128) {
    				icon_1_changes.$$scope = { dirty, ctx };
    			}

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(144:6) {#if icon}",
    		ctx
    	});

    	return block_1;
    }

    // (145:8) <Icon class={iClasses} {small}>
    function create_default_slot(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*icon*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*icon*/ 8) set_data_dev(t, /*icon*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(145:8) <Icon class={iClasses} {small}>",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    const classesDefault = "py-2 px-4 uppercase text-sm font-medium relative overflow-hidden";
    const basicDefault = "text-white duration-200 ease-in";
    const outlinedDefault = "bg-transparent border border-solid";
    const textDefault = "bg-transparent border-none px-4 hover:bg-transparent";
    const iconDefault = "p-4 flex items-center select-none";
    const fabDefault = "hover:bg-transparent";
    const smallDefault = "pt-1 pb-1 pl-2 pr-2 text-xs";
    const disabledDefault = "bg-gray-300 text-gray-500 dark:bg-dark-400 elevation-none pointer-events-none hover:bg-gray-300 cursor-default";
    const elevationDefault = "hover:elevation-5 elevation-3";

    function instance$1($$self, $$props, $$invalidate) {
    	let { value = false } = $$props;
    	let { outlined = false } = $$props;
    	let { text = false } = $$props;
    	let { block = false } = $$props;
    	let { disabled = false } = $$props;
    	let { icon = null } = $$props;
    	let { small = false } = $$props;
    	let { light = false } = $$props;
    	let { dark = false } = $$props;
    	let { flat = false } = $$props;
    	let { iconClass = "" } = $$props;
    	let { color = "primary" } = $$props;
    	let { href = null } = $$props;
    	let { fab = false } = $$props;
    	let { remove = "" } = $$props;
    	let { add = "" } = $$props;
    	let { replace = {} } = $$props;
    	let { classes = classesDefault } = $$props;
    	let { basicClasses = basicDefault } = $$props;
    	let { outlinedClasses = outlinedDefault } = $$props;
    	let { textClasses = textDefault } = $$props;
    	let { iconClasses = iconDefault } = $$props;
    	let { fabClasses = fabDefault } = $$props;
    	let { smallClasses = smallDefault } = $$props;
    	let { disabledClasses = disabledDefault } = $$props;
    	let { elevationClasses = elevationDefault } = $$props;
    	fab = fab || text && icon;
    	const basic = !outlined && !text && !fab;
    	const elevation = (basic || icon) && !disabled && !flat && !text;
    	let Classes = i => i;
    	let iClasses = i => i;
    	let shade = 0;
    	const { bg, border, txt } = utils(color);
    	const cb = new ClassBuilder(classes, classesDefault);
    	let iconCb;

    	if (icon) {
    		iconCb = new ClassBuilder(iconClass);
    	}

    	const ripple = r(text || fab || outlined ? color : "white");

    	const props = filterProps(
    		[
    			"outlined",
    			"text",
    			"color",
    			"block",
    			"disabled",
    			"icon",
    			"small",
    			"light",
    			"dark",
    			"flat",
    			"add",
    			"remove",
    			"replace"
    		],
    		$$props
    	);

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble($$self, event);
    	}

    	function _handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	function mouseover_handler_1(event) {
    		bubble($$self, event);
    	}

    	function _handler_1(event) {
    		bubble($$self, event);
    	}

    	const click_handler_2 = () => $$invalidate(0, value = !value);
    	const click_handler_3 = () => $$invalidate(0, value = !value);

    	$$self.$set = $$new_props => {
    		$$invalidate(50, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("outlined" in $$new_props) $$invalidate(10, outlined = $$new_props.outlined);
    		if ("text" in $$new_props) $$invalidate(11, text = $$new_props.text);
    		if ("block" in $$new_props) $$invalidate(12, block = $$new_props.block);
    		if ("disabled" in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("icon" in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    		if ("small" in $$new_props) $$invalidate(4, small = $$new_props.small);
    		if ("light" in $$new_props) $$invalidate(13, light = $$new_props.light);
    		if ("dark" in $$new_props) $$invalidate(14, dark = $$new_props.dark);
    		if ("flat" in $$new_props) $$invalidate(15, flat = $$new_props.flat);
    		if ("iconClass" in $$new_props) $$invalidate(16, iconClass = $$new_props.iconClass);
    		if ("color" in $$new_props) $$invalidate(17, color = $$new_props.color);
    		if ("href" in $$new_props) $$invalidate(5, href = $$new_props.href);
    		if ("fab" in $$new_props) $$invalidate(9, fab = $$new_props.fab);
    		if ("remove" in $$new_props) $$invalidate(18, remove = $$new_props.remove);
    		if ("add" in $$new_props) $$invalidate(19, add = $$new_props.add);
    		if ("replace" in $$new_props) $$invalidate(20, replace = $$new_props.replace);
    		if ("classes" in $$new_props) $$invalidate(1, classes = $$new_props.classes);
    		if ("basicClasses" in $$new_props) $$invalidate(21, basicClasses = $$new_props.basicClasses);
    		if ("outlinedClasses" in $$new_props) $$invalidate(22, outlinedClasses = $$new_props.outlinedClasses);
    		if ("textClasses" in $$new_props) $$invalidate(23, textClasses = $$new_props.textClasses);
    		if ("iconClasses" in $$new_props) $$invalidate(24, iconClasses = $$new_props.iconClasses);
    		if ("fabClasses" in $$new_props) $$invalidate(25, fabClasses = $$new_props.fabClasses);
    		if ("smallClasses" in $$new_props) $$invalidate(26, smallClasses = $$new_props.smallClasses);
    		if ("disabledClasses" in $$new_props) $$invalidate(27, disabledClasses = $$new_props.disabledClasses);
    		if ("elevationClasses" in $$new_props) $$invalidate(28, elevationClasses = $$new_props.elevationClasses);
    		if ("$$scope" in $$new_props) $$invalidate(38, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Icon,
    		utils,
    		ClassBuilder,
    		filterProps,
    		createRipple: r,
    		value,
    		outlined,
    		text,
    		block,
    		disabled,
    		icon,
    		small,
    		light,
    		dark,
    		flat,
    		iconClass,
    		color,
    		href,
    		fab,
    		remove,
    		add,
    		replace,
    		classesDefault,
    		basicDefault,
    		outlinedDefault,
    		textDefault,
    		iconDefault,
    		fabDefault,
    		smallDefault,
    		disabledDefault,
    		elevationDefault,
    		classes,
    		basicClasses,
    		outlinedClasses,
    		textClasses,
    		iconClasses,
    		fabClasses,
    		smallClasses,
    		disabledClasses,
    		elevationClasses,
    		basic,
    		elevation,
    		Classes,
    		iClasses,
    		shade,
    		bg,
    		border,
    		txt,
    		cb,
    		iconCb,
    		ripple,
    		props,
    		normal,
    		lighter
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(50, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("outlined" in $$props) $$invalidate(10, outlined = $$new_props.outlined);
    		if ("text" in $$props) $$invalidate(11, text = $$new_props.text);
    		if ("block" in $$props) $$invalidate(12, block = $$new_props.block);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("icon" in $$props) $$invalidate(3, icon = $$new_props.icon);
    		if ("small" in $$props) $$invalidate(4, small = $$new_props.small);
    		if ("light" in $$props) $$invalidate(13, light = $$new_props.light);
    		if ("dark" in $$props) $$invalidate(14, dark = $$new_props.dark);
    		if ("flat" in $$props) $$invalidate(15, flat = $$new_props.flat);
    		if ("iconClass" in $$props) $$invalidate(16, iconClass = $$new_props.iconClass);
    		if ("color" in $$props) $$invalidate(17, color = $$new_props.color);
    		if ("href" in $$props) $$invalidate(5, href = $$new_props.href);
    		if ("fab" in $$props) $$invalidate(9, fab = $$new_props.fab);
    		if ("remove" in $$props) $$invalidate(18, remove = $$new_props.remove);
    		if ("add" in $$props) $$invalidate(19, add = $$new_props.add);
    		if ("replace" in $$props) $$invalidate(20, replace = $$new_props.replace);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("basicClasses" in $$props) $$invalidate(21, basicClasses = $$new_props.basicClasses);
    		if ("outlinedClasses" in $$props) $$invalidate(22, outlinedClasses = $$new_props.outlinedClasses);
    		if ("textClasses" in $$props) $$invalidate(23, textClasses = $$new_props.textClasses);
    		if ("iconClasses" in $$props) $$invalidate(24, iconClasses = $$new_props.iconClasses);
    		if ("fabClasses" in $$props) $$invalidate(25, fabClasses = $$new_props.fabClasses);
    		if ("smallClasses" in $$props) $$invalidate(26, smallClasses = $$new_props.smallClasses);
    		if ("disabledClasses" in $$props) $$invalidate(27, disabledClasses = $$new_props.disabledClasses);
    		if ("elevationClasses" in $$props) $$invalidate(28, elevationClasses = $$new_props.elevationClasses);
    		if ("Classes" in $$props) Classes = $$new_props.Classes;
    		if ("iClasses" in $$props) $$invalidate(6, iClasses = $$new_props.iClasses);
    		if ("shade" in $$props) $$invalidate(39, shade = $$new_props.shade);
    		if ("iconCb" in $$props) $$invalidate(40, iconCb = $$new_props.iconCb);
    		if ("normal" in $$props) $$invalidate(41, normal = $$new_props.normal);
    		if ("lighter" in $$props) $$invalidate(42, lighter = $$new_props.lighter);
    	};

    	let normal;
    	let lighter;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*light, dark*/ 24576 | $$self.$$.dirty[1] & /*shade*/ 256) {
    			 {
    				$$invalidate(39, shade = light ? 200 : 0);
    				$$invalidate(39, shade = dark ? -400 : shade);
    			}
    		}

    		if ($$self.$$.dirty[1] & /*shade*/ 256) {
    			 $$invalidate(41, normal = 500 - shade);
    		}

    		if ($$self.$$.dirty[1] & /*shade*/ 256) {
    			 $$invalidate(42, lighter = 400 - shade);
    		}

    		 $$invalidate(1, classes = cb.flush().add(basicClasses, basic, basicDefault).add(`${bg(normal)} hover:${bg(lighter)}`, basic).add(elevationClasses, elevation, elevationDefault).add(outlinedClasses, outlined, outlinedDefault).add(`${border(lighter)} ${txt(normal)} hover:${bg("trans")} dark-hover:${bg("transDark")}`, outlined).add(`${txt(lighter)}`, text).add(textClasses, text, textDefault).add(iconClasses, icon, iconDefault).remove("py-2", icon).remove(txt(lighter), fab).add(disabledClasses, disabled, disabledDefault).add(smallClasses, small, smallDefault).add("flex items-center justify-center h-8 w-8", small && icon).add("border-solid", outlined).add("rounded-full", icon).add("w-full", block).add("rounded", basic || outlined || text).add("button", !icon).add(fabClasses, fab, fabDefault).add(`hover:${bg("transLight")}`, fab).add($$props.class).remove(remove).replace(replace).add(add).get());

    		if ($$self.$$.dirty[0] & /*fab, iconClass*/ 66048 | $$self.$$.dirty[1] & /*iconCb*/ 512) {
    			 if (iconCb) {
    				$$invalidate(6, iClasses = iconCb.flush().add(txt(), fab && !iconClass).get());
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		classes,
    		disabled,
    		icon,
    		small,
    		href,
    		iClasses,
    		ripple,
    		props,
    		fab,
    		outlined,
    		text,
    		block,
    		light,
    		dark,
    		flat,
    		iconClass,
    		color,
    		remove,
    		add,
    		replace,
    		basicClasses,
    		outlinedClasses,
    		textClasses,
    		iconClasses,
    		fabClasses,
    		smallClasses,
    		disabledClasses,
    		elevationClasses,
    		$$slots,
    		click_handler,
    		mouseover_handler,
    		_handler,
    		click_handler_1,
    		mouseover_handler_1,
    		_handler_1,
    		click_handler_2,
    		click_handler_3,
    		$$scope
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				value: 0,
    				outlined: 10,
    				text: 11,
    				block: 12,
    				disabled: 2,
    				icon: 3,
    				small: 4,
    				light: 13,
    				dark: 14,
    				flat: 15,
    				iconClass: 16,
    				color: 17,
    				href: 5,
    				fab: 9,
    				remove: 18,
    				add: 19,
    				replace: 20,
    				classes: 1,
    				basicClasses: 21,
    				outlinedClasses: 22,
    				textClasses: 23,
    				iconClasses: 24,
    				fabClasses: 25,
    				smallClasses: 26,
    				disabledClasses: 27,
    				elevationClasses: 28
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flat() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flat(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconClass() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconClass(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fab() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fab(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get basicClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basicClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlinedClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlinedClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fabClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fabClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get smallClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set smallClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabledClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabledClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elevationClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elevationClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quadIn(t) {
        return t * t;
    }
    function quadOut(t) {
        return -t * (t - 2.0);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* node_modules\smelte\src\components\Util\Spacer.svelte generated by Svelte v3.24.0 */

    const file$2 = "node_modules\\smelte\\src\\components\\Util\\Spacer.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "flex-grow");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Spacer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Spacer", $$slots, []);
    	return [];
    }

    class Spacer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spacer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const Spacer$1 = Spacer;

    /* node_modules\smelte\src\components\List\ListItem.svelte generated by Svelte v3.24.0 */
    const file$3 = "node_modules\\smelte\\src\\components\\List\\ListItem.svelte";

    // (59:2) {#if icon}
    function create_if_block_1$1(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				class: "pr-6",
    				small: /*dense*/ ctx[3],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*dense*/ 8) icon_1_changes.small = /*dense*/ ctx[3];

    			if (dirty & /*$$scope, icon*/ 4194305) {
    				icon_1_changes.$$scope = { dirty, ctx };
    			}

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(59:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (60:4) <Icon       class="pr-6"       small={dense}     >
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*icon*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icon*/ 1) set_data_dev(t, /*icon*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(60:4) <Icon       class=\\\"pr-6\\\"       small={dense}     >",
    		ctx
    	});

    	return block;
    }

    // (70:12) {text}
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*text*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(70:12) {text}",
    		ctx
    	});

    	return block;
    }

    // (72:4) {#if subheading}
    function create_if_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*subheading*/ ctx[2]);
    			attr_dev(div, "class", /*subheadingClasses*/ ctx[5]);
    			add_location(div, file$3, 72, 6, 1808);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*subheading*/ 4) set_data_dev(t, /*subheading*/ ctx[2]);

    			if (dirty & /*subheadingClasses*/ 32) {
    				attr_dev(div, "class", /*subheadingClasses*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(72:4) {#if subheading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let li;
    	let t0;
    	let div1;
    	let div0;
    	let div0_class_value;
    	let t1;
    	let ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon*/ ctx[0] && create_if_block_1$1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[22], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);
    	let if_block1 = /*subheading*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", div0_class_value = /*$$props*/ ctx[9].class);
    			add_location(div0, file$3, 68, 4, 1716);
    			attr_dev(div1, "class", "flex flex-col p-0");
    			add_location(div1, file$3, 67, 2, 1680);
    			attr_dev(li, "class", /*c*/ ctx[6]);
    			attr_dev(li, "tabindex", /*tabindex*/ ctx[4]);
    			add_location(li, file$3, 51, 0, 1479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if (if_block0) if_block0.m(li, null);
    			append_dev(li, t0);
    			append_dev(li, div1);
    			append_dev(div1, div0);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div0, null);
    			}

    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(ripple_action = /*ripple*/ ctx[7].call(null, li)),
    					listen_dev(li, "keypress", /*change*/ ctx[8], false, false, false),
    					listen_dev(li, "click", /*change*/ ctx[8], false, false, false),
    					listen_dev(li, "click", /*click_handler*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*icon*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*icon*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(li, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4194304) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[22], dirty, null, null);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*text*/ 2) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty & /*$$props*/ 512 && div0_class_value !== (div0_class_value = /*$$props*/ ctx[9].class)) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (/*subheading*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty & /*c*/ 64) {
    				attr_dev(li, "class", /*c*/ ctx[6]);
    			}

    			if (!current || dirty & /*tabindex*/ 16) {
    				attr_dev(li, "tabindex", /*tabindex*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block0) if_block0.d();
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$1 = "focus:bg-gray-50 dark-focus:bg-gray-700 hover:bg-gray-transDark relative overflow-hidden duration-100 p-4 cursor-pointer text-gray-700 dark:text-gray-100 flex items-center z-10";
    const selectedClassesDefault = "bg-gray-200 dark:bg-primary-transLight";
    const subheadingClassesDefault = "text-gray-600 p-0 text-sm";

    function instance$3($$self, $$props, $$invalidate) {
    	let { icon = "" } = $$props;
    	let { id = "" } = $$props;
    	let { value = "" } = $$props;
    	let { text = "" } = $$props;
    	let { subheading = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { dense = false } = $$props;
    	let { selected = false } = $$props;
    	let { tabindex = null } = $$props;
    	let { selectedClasses = selectedClassesDefault } = $$props;
    	let { subheadingClasses = subheadingClassesDefault } = $$props;
    	let { to = "" } = $$props;
    	const item = null;
    	const items = [];
    	const level = null;
    	const ripple = r();
    	const dispatch = createEventDispatcher();

    	function change() {
    		if (disabled) return;
    		$$invalidate(10, value = id);
    		dispatch("change", id, to);
    	}

    	let { classes = classesDefault$1 } = $$props;
    	const cb = new ClassBuilder(classes, classesDefault$1);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ListItem", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("icon" in $$new_props) $$invalidate(0, icon = $$new_props.icon);
    		if ("id" in $$new_props) $$invalidate(11, id = $$new_props.id);
    		if ("value" in $$new_props) $$invalidate(10, value = $$new_props.value);
    		if ("text" in $$new_props) $$invalidate(1, text = $$new_props.text);
    		if ("subheading" in $$new_props) $$invalidate(2, subheading = $$new_props.subheading);
    		if ("disabled" in $$new_props) $$invalidate(12, disabled = $$new_props.disabled);
    		if ("dense" in $$new_props) $$invalidate(3, dense = $$new_props.dense);
    		if ("selected" in $$new_props) $$invalidate(13, selected = $$new_props.selected);
    		if ("tabindex" in $$new_props) $$invalidate(4, tabindex = $$new_props.tabindex);
    		if ("selectedClasses" in $$new_props) $$invalidate(14, selectedClasses = $$new_props.selectedClasses);
    		if ("subheadingClasses" in $$new_props) $$invalidate(5, subheadingClasses = $$new_props.subheadingClasses);
    		if ("to" in $$new_props) $$invalidate(15, to = $$new_props.to);
    		if ("classes" in $$new_props) $$invalidate(19, classes = $$new_props.classes);
    		if ("$$scope" in $$new_props) $$invalidate(22, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		createEventDispatcher,
    		Icon,
    		createRipple: r,
    		classesDefault: classesDefault$1,
    		selectedClassesDefault,
    		subheadingClassesDefault,
    		icon,
    		id,
    		value,
    		text,
    		subheading,
    		disabled,
    		dense,
    		selected,
    		tabindex,
    		selectedClasses,
    		subheadingClasses,
    		to,
    		item,
    		items,
    		level,
    		ripple,
    		dispatch,
    		change,
    		classes,
    		cb,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ("icon" in $$props) $$invalidate(0, icon = $$new_props.icon);
    		if ("id" in $$props) $$invalidate(11, id = $$new_props.id);
    		if ("value" in $$props) $$invalidate(10, value = $$new_props.value);
    		if ("text" in $$props) $$invalidate(1, text = $$new_props.text);
    		if ("subheading" in $$props) $$invalidate(2, subheading = $$new_props.subheading);
    		if ("disabled" in $$props) $$invalidate(12, disabled = $$new_props.disabled);
    		if ("dense" in $$props) $$invalidate(3, dense = $$new_props.dense);
    		if ("selected" in $$props) $$invalidate(13, selected = $$new_props.selected);
    		if ("tabindex" in $$props) $$invalidate(4, tabindex = $$new_props.tabindex);
    		if ("selectedClasses" in $$props) $$invalidate(14, selectedClasses = $$new_props.selectedClasses);
    		if ("subheadingClasses" in $$props) $$invalidate(5, subheadingClasses = $$new_props.subheadingClasses);
    		if ("to" in $$props) $$invalidate(15, to = $$new_props.to);
    		if ("classes" in $$props) $$invalidate(19, classes = $$new_props.classes);
    		if ("c" in $$props) $$invalidate(6, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(6, c = cb.flush().add(selectedClasses, selected, selectedClassesDefault).add("py-2", dense).add("text-gray-600", disabled).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		icon,
    		text,
    		subheading,
    		dense,
    		tabindex,
    		subheadingClasses,
    		c,
    		ripple,
    		change,
    		$$props,
    		value,
    		id,
    		disabled,
    		selected,
    		selectedClasses,
    		to,
    		item,
    		items,
    		level,
    		classes,
    		$$slots,
    		click_handler,
    		$$scope
    	];
    }

    class ListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			icon: 0,
    			id: 11,
    			value: 10,
    			text: 1,
    			subheading: 2,
    			disabled: 12,
    			dense: 3,
    			selected: 13,
    			tabindex: 4,
    			selectedClasses: 14,
    			subheadingClasses: 5,
    			to: 15,
    			item: 16,
    			items: 17,
    			level: 18,
    			classes: 19
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListItem",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get icon() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subheading() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subheading(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedClasses() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedClasses(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subheadingClasses() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subheadingClasses(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get to() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		return this.$$.ctx[16];
    	}

    	set item(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		return this.$$.ctx[17];
    	}

    	set items(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get level() {
    		return this.$$.ctx[18];
    	}

    	set level(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\List\List.svelte generated by Svelte v3.24.0 */
    const file$4 = "node_modules\\smelte\\src\\components\\List\\List.svelte";

    const get_item_slot_changes_1 = dirty => ({
    	item: dirty & /*items*/ 2,
    	dense: dirty & /*dense*/ 4,
    	value: dirty & /*value*/ 1
    });

    const get_item_slot_context_1 = ctx => ({
    	item: /*item*/ ctx[6],
    	dense: /*dense*/ ctx[2],
    	value: /*value*/ ctx[0]
    });

    const get_item_slot_changes = dirty => ({
    	item: dirty & /*items*/ 2,
    	dense: dirty & /*dense*/ 4,
    	value: dirty & /*value*/ 1
    });

    const get_item_slot_context = ctx => ({
    	item: /*item*/ ctx[6],
    	dense: /*dense*/ ctx[2],
    	value: /*value*/ ctx[0]
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    // (55:4) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const item_slot_template = /*$$slots*/ ctx[12].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[18], get_item_slot_context_1);
    	const item_slot_or_fallback = item_slot || fallback_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (item_slot_or_fallback) item_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (item_slot_or_fallback) {
    				item_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (item_slot) {
    				if (item_slot.p && dirty & /*$$scope, items, dense, value*/ 262151) {
    					update_slot(item_slot, item_slot_template, ctx, /*$$scope*/ ctx[18], dirty, get_item_slot_changes_1, get_item_slot_context_1);
    				}
    			} else {
    				if (item_slot_or_fallback && item_slot_or_fallback.p && dirty & /*items, value, dense*/ 7) {
    					item_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (item_slot_or_fallback) item_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(55:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if item.to !== undefined}
    function create_if_block$2(ctx) {
    	let current;
    	const item_slot_template = /*$$slots*/ ctx[12].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[18], get_item_slot_context);
    	const item_slot_or_fallback = item_slot || fallback_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (item_slot_or_fallback) item_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (item_slot_or_fallback) {
    				item_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (item_slot) {
    				if (item_slot.p && dirty & /*$$scope, items, dense, value*/ 262151) {
    					update_slot(item_slot, item_slot_template, ctx, /*$$scope*/ ctx[18], dirty, get_item_slot_changes, get_item_slot_context);
    				}
    			} else {
    				if (item_slot_or_fallback && item_slot_or_fallback.p && dirty & /*items, dense, value*/ 7) {
    					item_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (item_slot_or_fallback) item_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(47:4) {#if item.to !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (57:8) <ListItem           bind:value           {selectedClasses}           {itemClasses}           {...item}           tabindex={i + 1}           id={id(item)}           selected={value === id(item)}           {dense}           on:change           on:click>
    function create_default_slot_1$1(ctx) {
    	let t_value = getText(/*item*/ ctx[6]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = getText(/*item*/ ctx[6]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(57:8) <ListItem           bind:value           {selectedClasses}           {itemClasses}           {...item}           tabindex={i + 1}           id={id(item)}           selected={value === id(item)}           {dense}           on:change           on:click>",
    		ctx
    	});

    	return block;
    }

    // (56:47)          
    function fallback_block_1(ctx) {
    	let listitem;
    	let updating_value;
    	let t;
    	let current;

    	const listitem_spread_levels = [
    		{
    			selectedClasses: /*selectedClasses*/ ctx[4]
    		},
    		{ itemClasses: /*itemClasses*/ ctx[5] },
    		/*item*/ ctx[6],
    		{ tabindex: /*i*/ ctx[22] + 1 },
    		{ id: id(/*item*/ ctx[6]) },
    		{
    			selected: /*value*/ ctx[0] === id(/*item*/ ctx[6])
    		},
    		{ dense: /*dense*/ ctx[2] }
    	];

    	function listitem_value_binding_1(value) {
    		/*listitem_value_binding_1*/ ctx[15].call(null, value);
    	}

    	let listitem_props = {
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < listitem_spread_levels.length; i += 1) {
    		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
    	}

    	if (/*value*/ ctx[0] !== void 0) {
    		listitem_props.value = /*value*/ ctx[0];
    	}

    	listitem = new ListItem({ props: listitem_props, $$inline: true });
    	binding_callbacks.push(() => bind(listitem, "value", listitem_value_binding_1));
    	listitem.$on("change", /*change_handler_1*/ ctx[16]);
    	listitem.$on("click", /*click_handler*/ ctx[17]);

    	const block = {
    		c: function create() {
    			create_component(listitem.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(listitem, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listitem_changes = (dirty & /*selectedClasses, itemClasses, items, id, value, dense*/ 55)
    			? get_spread_update(listitem_spread_levels, [
    					dirty & /*selectedClasses*/ 16 && {
    						selectedClasses: /*selectedClasses*/ ctx[4]
    					},
    					dirty & /*itemClasses*/ 32 && { itemClasses: /*itemClasses*/ ctx[5] },
    					dirty & /*items*/ 2 && get_spread_object(/*item*/ ctx[6]),
    					listitem_spread_levels[3],
    					dirty & /*id, items*/ 2 && { id: id(/*item*/ ctx[6]) },
    					dirty & /*value, id, items*/ 3 && {
    						selected: /*value*/ ctx[0] === id(/*item*/ ctx[6])
    					},
    					dirty & /*dense*/ 4 && { dense: /*dense*/ ctx[2] }
    				])
    			: {};

    			if (dirty & /*$$scope, items*/ 262146) {
    				listitem_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				listitem_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			listitem.$set(listitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listitem, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(56:47)          ",
    		ctx
    	});

    	return block;
    }

    // (50:10) <ListItem bind:value {...item} id={id(item)} {dense} on:change>
    function create_default_slot$2(ctx) {
    	let t_value = /*item*/ ctx[6].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[6].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(50:10) <ListItem bind:value {...item} id={id(item)} {dense} on:change>",
    		ctx
    	});

    	return block;
    }

    // (48:47)          
    function fallback_block$1(ctx) {
    	let a;
    	let listitem;
    	let updating_value;
    	let a_tabindex_value;
    	let a_href_value;
    	let t;
    	let current;
    	const listitem_spread_levels = [/*item*/ ctx[6], { id: id(/*item*/ ctx[6]) }, { dense: /*dense*/ ctx[2] }];

    	function listitem_value_binding(value) {
    		/*listitem_value_binding*/ ctx[13].call(null, value);
    	}

    	let listitem_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < listitem_spread_levels.length; i += 1) {
    		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
    	}

    	if (/*value*/ ctx[0] !== void 0) {
    		listitem_props.value = /*value*/ ctx[0];
    	}

    	listitem = new ListItem({ props: listitem_props, $$inline: true });
    	binding_callbacks.push(() => bind(listitem, "value", listitem_value_binding));
    	listitem.$on("change", /*change_handler*/ ctx[14]);

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(listitem.$$.fragment);
    			t = space();
    			attr_dev(a, "tabindex", a_tabindex_value = /*i*/ ctx[22] + 1);
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[6].to);
    			add_location(a, file$4, 48, 8, 1154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			mount_component(listitem, a, null);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listitem_changes = (dirty & /*items, id, dense*/ 6)
    			? get_spread_update(listitem_spread_levels, [
    					dirty & /*items*/ 2 && get_spread_object(/*item*/ ctx[6]),
    					dirty & /*id, items*/ 2 && { id: id(/*item*/ ctx[6]) },
    					dirty & /*dense*/ 4 && { dense: /*dense*/ ctx[2] }
    				])
    			: {};

    			if (dirty & /*$$scope, items*/ 262146) {
    				listitem_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				listitem_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			listitem.$set(listitem_changes);

    			if (!current || dirty & /*items*/ 2 && a_href_value !== (a_href_value = /*item*/ ctx[6].to)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(listitem);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$1.name,
    		type: "fallback",
    		source: "(48:47)          ",
    		ctx
    	});

    	return block;
    }

    // (46:2) {#each items as item, i}
    function create_each_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[6].to !== undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(46:2) {#each items as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let ul;
    	let current;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", /*c*/ ctx[7]);
    			toggle_class(ul, "rounded-t-none", /*select*/ ctx[3]);
    			add_location(ul, file$4, 44, 0, 994);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items, id, dense, value, $$scope, undefined, selectedClasses, itemClasses, getText*/ 262199) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*c*/ 128) {
    				attr_dev(ul, "class", /*c*/ ctx[7]);
    			}

    			if (dirty & /*c, select*/ 136) {
    				toggle_class(ul, "rounded-t-none", /*select*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$2 = "py-2 rounded";

    function id(i) {
    	if (i.id !== undefined) return i.id;
    	if (i.value !== undefined) return i.value;
    	if (i.to !== undefined) return i.to;
    	if (i.text !== undefined) return i.text;
    	return i;
    }

    function getText(i) {
    	if (i.text !== undefined) return i.text;
    	if (i.value !== undefined) return i.value;
    	return i;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { items = [] } = $$props;
    	let { value = "" } = $$props;
    	let { dense = false } = $$props;
    	let { select = false } = $$props;
    	const level = null;
    	const text = "";
    	const item = {};
    	const to = null;
    	const selectedClasses = i => i;
    	const itemClasses = i => i;
    	let { classes = classesDefault$2 } = $$props;
    	const cb = new ClassBuilder($$props.class);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("List", $$slots, ['item']);

    	function listitem_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function listitem_value_binding_1(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("items" in $$new_props) $$invalidate(1, items = $$new_props.items);
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("dense" in $$new_props) $$invalidate(2, dense = $$new_props.dense);
    		if ("select" in $$new_props) $$invalidate(3, select = $$new_props.select);
    		if ("classes" in $$new_props) $$invalidate(11, classes = $$new_props.classes);
    		if ("$$scope" in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		ListItem,
    		items,
    		value,
    		dense,
    		select,
    		level,
    		text,
    		item,
    		to,
    		selectedClasses,
    		itemClasses,
    		classesDefault: classesDefault$2,
    		classes,
    		id,
    		getText,
    		cb,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), $$new_props));
    		if ("items" in $$props) $$invalidate(1, items = $$new_props.items);
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("dense" in $$props) $$invalidate(2, dense = $$new_props.dense);
    		if ("select" in $$props) $$invalidate(3, select = $$new_props.select);
    		if ("classes" in $$props) $$invalidate(11, classes = $$new_props.classes);
    		if ("c" in $$props) $$invalidate(7, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(7, c = cb.flush().add(classes, true, classesDefault$2).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		items,
    		dense,
    		select,
    		selectedClasses,
    		itemClasses,
    		item,
    		c,
    		level,
    		text,
    		to,
    		classes,
    		$$slots,
    		listitem_value_binding,
    		change_handler,
    		listitem_value_binding_1,
    		change_handler_1,
    		click_handler,
    		$$scope
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			items: 1,
    			value: 0,
    			dense: 2,
    			select: 3,
    			level: 8,
    			text: 9,
    			item: 6,
    			to: 10,
    			selectedClasses: 4,
    			itemClasses: 5,
    			classes: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get items() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set select(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get level() {
    		return this.$$.ctx[8];
    	}

    	set level(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		return this.$$.ctx[9];
    	}

    	set text(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		return this.$$.ctx[6];
    	}

    	set item(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get to() {
    		return this.$$.ctx[10];
    	}

    	set to(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedClasses() {
    		return this.$$.ctx[4];
    	}

    	set selectedClasses(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemClasses() {
    		return this.$$.ctx[5];
    	}

    	set itemClasses(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\TextField\Label.svelte generated by Svelte v3.24.0 */
    const file$5 = "node_modules\\smelte\\src\\components\\TextField\\Label.svelte";

    function create_fragment$5(ctx) {
    	let label;
    	let label_class_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let label_levels = [
    		{
    			class: label_class_value = "" + (/*lClasses*/ ctx[0] + " " + /*$$props*/ ctx[2].class)
    		},
    		/*props*/ ctx[1]
    	];

    	let label_data = {};

    	for (let i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			if (default_slot) default_slot.c();
    			set_attributes(label, label_data);
    			toggle_class(label, "svelte-r33x2y", true);
    			add_location(label, file$5, 74, 0, 1625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);

    			if (default_slot) {
    				default_slot.m(label, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32768) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[15], dirty, null, null);
    				}
    			}

    			set_attributes(label, label_data = get_spread_update(label_levels, [
    				(!current || dirty & /*lClasses, $$props*/ 5 && label_class_value !== (label_class_value = "" + (/*lClasses*/ ctx[0] + " " + /*$$props*/ ctx[2].class))) && { class: label_class_value },
    				/*props*/ ctx[1]
    			]));

    			toggle_class(label, "svelte-r33x2y", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { focused = false } = $$props;
    	let { error = false } = $$props;
    	let { outlined = false } = $$props;
    	let { labelOnTop = false } = $$props;
    	let { prepend = false } = $$props;
    	let { color = "primary" } = $$props;
    	let { bgColor = "white" } = $$props;
    	let { dense = false } = $$props;
    	let labelDefault = `pt-4 absolute top-0 label-transition block pb-2 px-4 pointer-events-none cursor-text`;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { labelClasses = labelDefault } = $$props;
    	const { bg, border, txt, caret } = utils(color);
    	const l = new ClassBuilder(labelClasses, labelDefault);
    	let lClasses = i => i;
    	const props = filterProps(["focused", "error", "outlined", "labelOnTop", "prepend", "color", "dense"], $$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Label", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("focused" in $$new_props) $$invalidate(3, focused = $$new_props.focused);
    		if ("error" in $$new_props) $$invalidate(4, error = $$new_props.error);
    		if ("outlined" in $$new_props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("labelOnTop" in $$new_props) $$invalidate(6, labelOnTop = $$new_props.labelOnTop);
    		if ("prepend" in $$new_props) $$invalidate(7, prepend = $$new_props.prepend);
    		if ("color" in $$new_props) $$invalidate(8, color = $$new_props.color);
    		if ("bgColor" in $$new_props) $$invalidate(9, bgColor = $$new_props.bgColor);
    		if ("dense" in $$new_props) $$invalidate(10, dense = $$new_props.dense);
    		if ("add" in $$new_props) $$invalidate(11, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(12, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(13, replace = $$new_props.replace);
    		if ("labelClasses" in $$new_props) $$invalidate(14, labelClasses = $$new_props.labelClasses);
    		if ("$$scope" in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		utils,
    		ClassBuilder,
    		filterProps,
    		focused,
    		error,
    		outlined,
    		labelOnTop,
    		prepend,
    		color,
    		bgColor,
    		dense,
    		labelDefault,
    		add,
    		remove,
    		replace,
    		labelClasses,
    		bg,
    		border,
    		txt,
    		caret,
    		l,
    		lClasses,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("focused" in $$props) $$invalidate(3, focused = $$new_props.focused);
    		if ("error" in $$props) $$invalidate(4, error = $$new_props.error);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("labelOnTop" in $$props) $$invalidate(6, labelOnTop = $$new_props.labelOnTop);
    		if ("prepend" in $$props) $$invalidate(7, prepend = $$new_props.prepend);
    		if ("color" in $$props) $$invalidate(8, color = $$new_props.color);
    		if ("bgColor" in $$props) $$invalidate(9, bgColor = $$new_props.bgColor);
    		if ("dense" in $$props) $$invalidate(10, dense = $$new_props.dense);
    		if ("labelDefault" in $$props) labelDefault = $$new_props.labelDefault;
    		if ("add" in $$props) $$invalidate(11, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(12, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(13, replace = $$new_props.replace);
    		if ("labelClasses" in $$props) $$invalidate(14, labelClasses = $$new_props.labelClasses);
    		if ("lClasses" in $$props) $$invalidate(0, lClasses = $$new_props.lClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*focused, error, labelOnTop, outlined, bgColor, prepend, dense, add, remove, replace*/ 16120) {
    			 $$invalidate(0, lClasses = l.flush().add(txt(), focused && !error).add("text-error-500", focused && error).add("label-top text-xs", labelOnTop).add("text-xs", focused).remove("pt-4 pb-2 px-4 px-1 pt-0", labelOnTop && outlined).add(`ml-3 p-1 pt-0 mt-0 bg-${bgColor} dark:bg-dark-500`, labelOnTop && outlined).remove("px-4", prepend).add("pr-4 pl-10", prepend).remove("pt-4", dense).add("pt-3", dense).add(add).remove(remove).replace(replace).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		lClasses,
    		props,
    		$$props,
    		focused,
    		error,
    		outlined,
    		labelOnTop,
    		prepend,
    		color,
    		bgColor,
    		dense,
    		add,
    		remove,
    		replace,
    		labelClasses,
    		$$scope,
    		$$slots
    	];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			focused: 3,
    			error: 4,
    			outlined: 5,
    			labelOnTop: 6,
    			prepend: 7,
    			color: 8,
    			bgColor: 9,
    			dense: 10,
    			add: 11,
    			remove: 12,
    			replace: 13,
    			labelClasses: 14
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get focused() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focused(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelOnTop() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelOnTop(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prepend() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prepend(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelClasses() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelClasses(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\TextField\Hint.svelte generated by Svelte v3.24.0 */
    const file$6 = "node_modules\\smelte\\src\\components\\TextField\\Hint.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let t0_value = (/*hint*/ ctx[1] || "") + "";
    	let t0;
    	let t1;
    	let t2_value = (/*error*/ ctx[0] || "") + "";
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(div, "class", /*classes*/ ctx[3]);
    			add_location(div, file$6, 36, 0, 797);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*hint*/ 2) && t0_value !== (t0_value = (/*hint*/ ctx[1] || "") + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*error*/ 1) && t2_value !== (t2_value = (/*error*/ ctx[0] || "") + "")) set_data_dev(t2, t2_value);

    			if (!current || dirty & /*classes*/ 8) {
    				attr_dev(div, "class", /*classes*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, /*transitionProps*/ ctx[2], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, /*transitionProps*/ ctx[2], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let classesDefault = "text-xs py-1 pl-4 absolute bottom-1 left-0";
    	let { error = false } = $$props;
    	let { hint = "" } = $$props;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { transitionProps = { y: -10, duration: 100, easing: quadOut } } = $$props;
    	const l = new ClassBuilder($$props.class, classesDefault);
    	let Classes = i => i;
    	const props = filterProps(["error", "hint"], $$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Hint", $$slots, []);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("error" in $$new_props) $$invalidate(0, error = $$new_props.error);
    		if ("hint" in $$new_props) $$invalidate(1, hint = $$new_props.hint);
    		if ("add" in $$new_props) $$invalidate(4, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(5, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(6, replace = $$new_props.replace);
    		if ("transitionProps" in $$new_props) $$invalidate(2, transitionProps = $$new_props.transitionProps);
    	};

    	$$self.$capture_state = () => ({
    		utils,
    		ClassBuilder,
    		filterProps,
    		fly,
    		quadOut,
    		classesDefault,
    		error,
    		hint,
    		add,
    		remove,
    		replace,
    		transitionProps,
    		l,
    		Classes,
    		props,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("classesDefault" in $$props) classesDefault = $$new_props.classesDefault;
    		if ("error" in $$props) $$invalidate(0, error = $$new_props.error);
    		if ("hint" in $$props) $$invalidate(1, hint = $$new_props.hint);
    		if ("add" in $$props) $$invalidate(4, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(5, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(6, replace = $$new_props.replace);
    		if ("transitionProps" in $$props) $$invalidate(2, transitionProps = $$new_props.transitionProps);
    		if ("Classes" in $$props) Classes = $$new_props.Classes;
    		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*error, hint, add, remove, replace*/ 115) {
    			 $$invalidate(3, classes = l.flush().add("text-error-500", error).add("text-gray-600", hint).add(add).remove(remove).replace(replace).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [error, hint, transitionProps, classes, add, remove, replace];
    }

    class Hint extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			error: 0,
    			hint: 1,
    			add: 4,
    			remove: 5,
    			replace: 6,
    			transitionProps: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hint",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get error() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionProps() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionProps(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\TextField\Underline.svelte generated by Svelte v3.24.0 */
    const file$7 = "node_modules\\smelte\\src\\components\\TextField\\Underline.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*classes*/ ctx[2]) + " svelte-xd9zs6"));
    			set_style(div0, "height", "2px");
    			set_style(div0, "transition", "width .2s ease");
    			add_location(div0, file$7, 61, 2, 1133);
    			attr_dev(div1, "class", div1_class_value = "line absolute bottom-0 left-0 w-full bg-gray-600 " + /*$$props*/ ctx[3].class + " svelte-xd9zs6");
    			toggle_class(div1, "hidden", /*noUnderline*/ ctx[0] || /*outlined*/ ctx[1]);
    			add_location(div1, file$7, 58, 0, 1009);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*classes*/ 4 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*classes*/ ctx[2]) + " svelte-xd9zs6"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*$$props*/ 8 && div1_class_value !== (div1_class_value = "line absolute bottom-0 left-0 w-full bg-gray-600 " + /*$$props*/ ctx[3].class + " svelte-xd9zs6")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*$$props, noUnderline, outlined*/ 11) {
    				toggle_class(div1, "hidden", /*noUnderline*/ ctx[0] || /*outlined*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { noUnderline = false } = $$props;
    	let { outlined = false } = $$props;
    	let { focused = false } = $$props;
    	let { error = false } = $$props;
    	let { color = "primary" } = $$props;
    	let defaultClasses = `mx-auto w-0`;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { lineClasses = defaultClasses } = $$props;
    	const { bg, border, txt, caret } = utils(color);
    	const l = new ClassBuilder(lineClasses, defaultClasses);
    	let Classes = i => i;
    	const props = filterProps(["focused", "error", "outlined", "labelOnTop", "prepend", "bgcolor", "color"], $$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Underline", $$slots, []);

    	$$self.$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("noUnderline" in $$new_props) $$invalidate(0, noUnderline = $$new_props.noUnderline);
    		if ("outlined" in $$new_props) $$invalidate(1, outlined = $$new_props.outlined);
    		if ("focused" in $$new_props) $$invalidate(4, focused = $$new_props.focused);
    		if ("error" in $$new_props) $$invalidate(5, error = $$new_props.error);
    		if ("color" in $$new_props) $$invalidate(6, color = $$new_props.color);
    		if ("add" in $$new_props) $$invalidate(7, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(8, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(9, replace = $$new_props.replace);
    		if ("lineClasses" in $$new_props) $$invalidate(10, lineClasses = $$new_props.lineClasses);
    	};

    	$$self.$capture_state = () => ({
    		utils,
    		ClassBuilder,
    		filterProps,
    		noUnderline,
    		outlined,
    		focused,
    		error,
    		color,
    		defaultClasses,
    		add,
    		remove,
    		replace,
    		lineClasses,
    		bg,
    		border,
    		txt,
    		caret,
    		l,
    		Classes,
    		props,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("noUnderline" in $$props) $$invalidate(0, noUnderline = $$new_props.noUnderline);
    		if ("outlined" in $$props) $$invalidate(1, outlined = $$new_props.outlined);
    		if ("focused" in $$props) $$invalidate(4, focused = $$new_props.focused);
    		if ("error" in $$props) $$invalidate(5, error = $$new_props.error);
    		if ("color" in $$props) $$invalidate(6, color = $$new_props.color);
    		if ("defaultClasses" in $$props) defaultClasses = $$new_props.defaultClasses;
    		if ("add" in $$props) $$invalidate(7, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(8, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(9, replace = $$new_props.replace);
    		if ("lineClasses" in $$props) $$invalidate(10, lineClasses = $$new_props.lineClasses);
    		if ("Classes" in $$props) Classes = $$new_props.Classes;
    		if ("classes" in $$props) $$invalidate(2, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*focused, error, add, remove, replace*/ 944) {
    			 $$invalidate(2, classes = l.flush().add(txt(), focused && !error).add("bg-error-500", error).add("w-full", focused || error).add(bg(), focused).add(add).remove(remove).replace(replace).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		noUnderline,
    		outlined,
    		classes,
    		$$props,
    		focused,
    		error,
    		color,
    		add,
    		remove,
    		replace,
    		lineClasses
    	];
    }

    class Underline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			noUnderline: 0,
    			outlined: 1,
    			focused: 4,
    			error: 5,
    			color: 6,
    			add: 7,
    			remove: 8,
    			replace: 9,
    			lineClasses: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Underline",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get noUnderline() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noUnderline(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focused() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focused(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineClasses() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineClasses(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\TextField\TextField.svelte generated by Svelte v3.24.0 */
    const file$8 = "node_modules\\smelte\\src\\components\\TextField\\TextField.svelte";
    const get_prepend_slot_changes = dirty => ({});
    const get_prepend_slot_context = ctx => ({});
    const get_append_slot_changes = dirty => ({});
    const get_append_slot_context = ctx => ({});
    const get_label_slot_changes = dirty => ({});
    const get_label_slot_context = ctx => ({});

    // (140:2) {#if label}
    function create_if_block_6(ctx) {
    	let current;
    	const label_slot_template = /*$$slots*/ ctx[40].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[60], get_label_slot_context);
    	const label_slot_or_fallback = label_slot || fallback_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (label_slot_or_fallback) label_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (label_slot_or_fallback) {
    				label_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (label_slot) {
    				if (label_slot.p && dirty[1] & /*$$scope*/ 536870912) {
    					update_slot(label_slot, label_slot_template, ctx, /*$$scope*/ ctx[60], dirty, get_label_slot_changes, get_label_slot_context);
    				}
    			} else {
    				if (label_slot_or_fallback && label_slot_or_fallback.p && dirty[0] & /*labelOnTop, focused, error, outlined, prepend, color, bgColor, dense, label*/ 33952078) {
    					label_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(140:2) {#if label}",
    		ctx
    	});

    	return block;
    }

    // (142:4) <Label       {labelOnTop}       {focused}       {error}       {outlined}       {prepend}       {color}       {bgColor}       dense={dense && !outlined}     >
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*label*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*label*/ 8) set_data_dev(t, /*label*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(142:4) <Label       {labelOnTop}       {focused}       {error}       {outlined}       {prepend}       {color}       {bgColor}       dense={dense && !outlined}     >",
    		ctx
    	});

    	return block;
    }

    // (141:21)      
    function fallback_block_2(ctx) {
    	let label_1;
    	let current;

    	label_1 = new Label({
    			props: {
    				labelOnTop: /*labelOnTop*/ ctx[25],
    				focused: /*focused*/ ctx[1],
    				error: /*error*/ ctx[6],
    				outlined: /*outlined*/ ctx[2],
    				prepend: /*prepend*/ ctx[8],
    				color: /*color*/ ctx[17],
    				bgColor: /*bgColor*/ ctx[18],
    				dense: /*dense*/ ctx[12] && !/*outlined*/ ctx[2],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_1_changes = {};
    			if (dirty[0] & /*labelOnTop*/ 33554432) label_1_changes.labelOnTop = /*labelOnTop*/ ctx[25];
    			if (dirty[0] & /*focused*/ 2) label_1_changes.focused = /*focused*/ ctx[1];
    			if (dirty[0] & /*error*/ 64) label_1_changes.error = /*error*/ ctx[6];
    			if (dirty[0] & /*outlined*/ 4) label_1_changes.outlined = /*outlined*/ ctx[2];
    			if (dirty[0] & /*prepend*/ 256) label_1_changes.prepend = /*prepend*/ ctx[8];
    			if (dirty[0] & /*color*/ 131072) label_1_changes.color = /*color*/ ctx[17];
    			if (dirty[0] & /*bgColor*/ 262144) label_1_changes.bgColor = /*bgColor*/ ctx[18];
    			if (dirty[0] & /*dense, outlined*/ 4100) label_1_changes.dense = /*dense*/ ctx[12] && !/*outlined*/ ctx[2];

    			if (dirty[0] & /*label*/ 8 | dirty[1] & /*$$scope*/ 536870912) {
    				label_1_changes.$$scope = { dirty, ctx };
    			}

    			label_1.$set(label_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2.name,
    		type: "fallback",
    		source: "(141:21)      ",
    		ctx
    	});

    	return block;
    }

    // (186:36) 
    function create_if_block_5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			input.readOnly = true;
    			attr_dev(input, "class", /*iClasses*/ ctx[26]);
    			input.disabled = /*disabled*/ ctx[20];
    			input.value = /*value*/ ctx[0];
    			add_location(input, file$8, 186, 4, 4892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*change_handler_2*/ ctx[51], false, false, false),
    					listen_dev(input, "input", /*input_handler_2*/ ctx[52], false, false, false),
    					listen_dev(input, "click", /*click_handler_2*/ ctx[53], false, false, false),
    					listen_dev(input, "blur", /*blur_handler_2*/ ctx[54], false, false, false),
    					listen_dev(input, "focus", /*focus_handler_2*/ ctx[55], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iClasses*/ 67108864) {
    				attr_dev(input, "class", /*iClasses*/ ctx[26]);
    			}

    			if (dirty[0] & /*disabled*/ 1048576) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[20]);
    			}

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(186:36) ",
    		ctx
    	});

    	return block;
    }

    // (170:32) 
    function create_if_block_4(ctx) {
    	let textarea_1;
    	let textarea_1_placeholder_value;
    	let mounted;
    	let dispose;

    	let textarea_1_levels = [
    		{ rows: /*rows*/ ctx[10] },
    		{ "aria-label": /*label*/ ctx[3] },
    		{ class: /*iClasses*/ ctx[26] },
    		{ disabled: /*disabled*/ ctx[20] },
    		/*props*/ ctx[29],
    		{
    			placeholder: textarea_1_placeholder_value = !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : ""
    		}
    	];

    	let textarea_1_data = {};

    	for (let i = 0; i < textarea_1_levels.length; i += 1) {
    		textarea_1_data = assign(textarea_1_data, textarea_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea_1 = element("textarea");
    			set_attributes(textarea_1, textarea_1_data);
    			add_location(textarea_1, file$8, 170, 4, 4544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea_1, anchor);
    			set_input_value(textarea_1, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea_1, "change", /*change_handler_1*/ ctx[46], false, false, false),
    					listen_dev(textarea_1, "input", /*input_handler_1*/ ctx[47], false, false, false),
    					listen_dev(textarea_1, "click", /*click_handler_1*/ ctx[48], false, false, false),
    					listen_dev(textarea_1, "focus", /*focus_handler_1*/ ctx[49], false, false, false),
    					listen_dev(textarea_1, "blur", /*blur_handler_1*/ ctx[50], false, false, false),
    					listen_dev(textarea_1, "input", /*textarea_1_input_handler*/ ctx[57]),
    					listen_dev(textarea_1, "focus", /*toggleFocused*/ ctx[28], false, false, false),
    					listen_dev(textarea_1, "blur", /*toggleFocused*/ ctx[28], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(textarea_1, textarea_1_data = get_spread_update(textarea_1_levels, [
    				dirty[0] & /*rows*/ 1024 && { rows: /*rows*/ ctx[10] },
    				dirty[0] & /*label*/ 8 && { "aria-label": /*label*/ ctx[3] },
    				dirty[0] & /*iClasses*/ 67108864 && { class: /*iClasses*/ ctx[26] },
    				dirty[0] & /*disabled*/ 1048576 && { disabled: /*disabled*/ ctx[20] },
    				/*props*/ ctx[29],
    				dirty[0] & /*value, placeholder*/ 17 && textarea_1_placeholder_value !== (textarea_1_placeholder_value = !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : "") && {
    					placeholder: textarea_1_placeholder_value
    				}
    			]));

    			if (dirty[0] & /*value*/ 1) {
    				set_input_value(textarea_1, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(170:32) ",
    		ctx
    	});

    	return block;
    }

    // (155:2) {#if (!textarea && !select) || autocomplete}
    function create_if_block_3(ctx) {
    	let input;
    	let input_placeholder_value;
    	let mounted;
    	let dispose;

    	let input_levels = [
    		{ "aria-label": /*label*/ ctx[3] },
    		{ class: /*iClasses*/ ctx[26] },
    		{ disabled: /*disabled*/ ctx[20] },
    		/*props*/ ctx[29],
    		{
    			placeholder: input_placeholder_value = !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : ""
    		}
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$8, 155, 4, 4216);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "focus", /*toggleFocused*/ ctx[28], false, false, false),
    					listen_dev(input, "blur", /*toggleFocused*/ ctx[28], false, false, false),
    					listen_dev(input, "blur", /*blur_handler*/ ctx[41], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[56]),
    					listen_dev(input, "change", /*change_handler*/ ctx[42], false, false, false),
    					listen_dev(input, "input", /*input_handler*/ ctx[43], false, false, false),
    					listen_dev(input, "click", /*click_handler*/ ctx[44], false, false, false),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[45], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty[0] & /*label*/ 8 && { "aria-label": /*label*/ ctx[3] },
    				dirty[0] & /*iClasses*/ 67108864 && { class: /*iClasses*/ ctx[26] },
    				dirty[0] & /*disabled*/ 1048576 && { disabled: /*disabled*/ ctx[20] },
    				/*props*/ ctx[29],
    				dirty[0] & /*value, placeholder*/ 17 && input_placeholder_value !== (input_placeholder_value = !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : "") && { placeholder: input_placeholder_value }
    			]));

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(155:2) {#if (!textarea && !select) || autocomplete}",
    		ctx
    	});

    	return block;
    }

    // (199:2) {#if append}
    function create_if_block_2$1(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const append_slot_template = /*$$slots*/ ctx[40].append;
    	const append_slot = create_slot(append_slot_template, ctx, /*$$scope*/ ctx[60], get_append_slot_context);
    	const append_slot_or_fallback = append_slot || fallback_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (append_slot_or_fallback) append_slot_or_fallback.c();
    			attr_dev(div, "class", /*aClasses*/ ctx[22]);
    			add_location(div, file$8, 199, 4, 5076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (append_slot_or_fallback) {
    				append_slot_or_fallback.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_3*/ ctx[58], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (append_slot) {
    				if (append_slot.p && dirty[1] & /*$$scope*/ 536870912) {
    					update_slot(append_slot, append_slot_template, ctx, /*$$scope*/ ctx[60], dirty, get_append_slot_changes, get_append_slot_context);
    				}
    			} else {
    				if (append_slot_or_fallback && append_slot_or_fallback.p && dirty[0] & /*appendReverse, focused, iconClass, append*/ 557186) {
    					append_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty[0] & /*aClasses*/ 4194304) {
    				attr_dev(div, "class", /*aClasses*/ ctx[22]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(append_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(append_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (append_slot_or_fallback) append_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(199:2) {#if append}",
    		ctx
    	});

    	return block;
    }

    // (205:8) <Icon           reverse={appendReverse}           class="{focused ? txt() : ""} {iconClass}"         >
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*append*/ ctx[7]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*append*/ 128) set_data_dev(t, /*append*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(205:8) <Icon           reverse={appendReverse}           class=\\\"{focused ? txt() : \\\"\\\"} {iconClass}\\\"         >",
    		ctx
    	});

    	return block;
    }

    // (204:26)          
    function fallback_block_1$1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				reverse: /*appendReverse*/ ctx[15],
    				class: "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[27]() : "") + " " + /*iconClass*/ ctx[19]),
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty[0] & /*appendReverse*/ 32768) icon_changes.reverse = /*appendReverse*/ ctx[15];
    			if (dirty[0] & /*focused, iconClass*/ 524290) icon_changes.class = "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[27]() : "") + " " + /*iconClass*/ ctx[19]);

    			if (dirty[0] & /*append*/ 128 | dirty[1] & /*$$scope*/ 536870912) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1$1.name,
    		type: "fallback",
    		source: "(204:26)          ",
    		ctx
    	});

    	return block;
    }

    // (215:2) {#if prepend}
    function create_if_block_1$2(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const prepend_slot_template = /*$$slots*/ ctx[40].prepend;
    	const prepend_slot = create_slot(prepend_slot_template, ctx, /*$$scope*/ ctx[60], get_prepend_slot_context);
    	const prepend_slot_or_fallback = prepend_slot || fallback_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (prepend_slot_or_fallback) prepend_slot_or_fallback.c();
    			attr_dev(div, "class", /*pClasses*/ ctx[23]);
    			add_location(div, file$8, 215, 4, 5385);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (prepend_slot_or_fallback) {
    				prepend_slot_or_fallback.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_4*/ ctx[59], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (prepend_slot) {
    				if (prepend_slot.p && dirty[1] & /*$$scope*/ 536870912) {
    					update_slot(prepend_slot, prepend_slot_template, ctx, /*$$scope*/ ctx[60], dirty, get_prepend_slot_changes, get_prepend_slot_context);
    				}
    			} else {
    				if (prepend_slot_or_fallback && prepend_slot_or_fallback.p && dirty[0] & /*prependReverse, focused, iconClass, prepend*/ 590082) {
    					prepend_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty[0] & /*pClasses*/ 8388608) {
    				attr_dev(div, "class", /*pClasses*/ ctx[23]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prepend_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prepend_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (prepend_slot_or_fallback) prepend_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(215:2) {#if prepend}",
    		ctx
    	});

    	return block;
    }

    // (221:8) <Icon           reverse={prependReverse}           class="{focused ? txt() : ""} {iconClass}"         >
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*prepend*/ ctx[8]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*prepend*/ 256) set_data_dev(t, /*prepend*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(221:8) <Icon           reverse={prependReverse}           class=\\\"{focused ? txt() : \\\"\\\"} {iconClass}\\\"         >",
    		ctx
    	});

    	return block;
    }

    // (220:27)          
    function fallback_block$2(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				reverse: /*prependReverse*/ ctx[16],
    				class: "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[27]() : "") + " " + /*iconClass*/ ctx[19]),
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty[0] & /*prependReverse*/ 65536) icon_changes.reverse = /*prependReverse*/ ctx[16];
    			if (dirty[0] & /*focused, iconClass*/ 524290) icon_changes.class = "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[27]() : "") + " " + /*iconClass*/ ctx[19]);

    			if (dirty[0] & /*prepend*/ 256 | dirty[1] & /*$$scope*/ 536870912) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$2.name,
    		type: "fallback",
    		source: "(220:27)          ",
    		ctx
    	});

    	return block;
    }

    // (237:2) {#if showHint}
    function create_if_block$3(ctx) {
    	let hint_1;
    	let current;

    	hint_1 = new Hint({
    			props: {
    				error: /*error*/ ctx[6],
    				hint: /*hint*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(hint_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(hint_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const hint_1_changes = {};
    			if (dirty[0] & /*error*/ 64) hint_1_changes.error = /*error*/ ctx[6];
    			if (dirty[0] & /*hint*/ 32) hint_1_changes.hint = /*hint*/ ctx[5];
    			hint_1.$set(hint_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hint_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(237:2) {#if showHint}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let underline;
    	let t4;
    	let current;
    	let if_block0 = /*label*/ ctx[3] && create_if_block_6(ctx);

    	function select_block_type(ctx, dirty) {
    		if (!/*textarea*/ ctx[9] && !/*select*/ ctx[11] || /*autocomplete*/ ctx[13]) return create_if_block_3;
    		if (/*textarea*/ ctx[9] && !/*select*/ ctx[11]) return create_if_block_4;
    		if (/*select*/ ctx[11] && !/*autocomplete*/ ctx[13]) return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type && current_block_type(ctx);
    	let if_block2 = /*append*/ ctx[7] && create_if_block_2$1(ctx);
    	let if_block3 = /*prepend*/ ctx[8] && create_if_block_1$2(ctx);

    	underline = new Underline({
    			props: {
    				noUnderline: /*noUnderline*/ ctx[14],
    				outlined: /*outlined*/ ctx[2],
    				focused: /*focused*/ ctx[1],
    				error: /*error*/ ctx[6]
    			},
    			$$inline: true
    		});

    	let if_block4 = /*showHint*/ ctx[24] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			create_component(underline.$$.fragment);
    			t4 = space();
    			if (if_block4) if_block4.c();
    			attr_dev(div, "class", /*wClasses*/ ctx[21]);
    			add_location(div, file$8, 138, 0, 3910);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			append_dev(div, t3);
    			mount_component(underline, div, null);
    			append_dev(div, t4);
    			if (if_block4) if_block4.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*label*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*label*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type && current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			}

    			if (/*append*/ ctx[7]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*append*/ 128) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*prepend*/ ctx[8]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*prepend*/ 256) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			const underline_changes = {};
    			if (dirty[0] & /*noUnderline*/ 16384) underline_changes.noUnderline = /*noUnderline*/ ctx[14];
    			if (dirty[0] & /*outlined*/ 4) underline_changes.outlined = /*outlined*/ ctx[2];
    			if (dirty[0] & /*focused*/ 2) underline_changes.focused = /*focused*/ ctx[1];
    			if (dirty[0] & /*error*/ 64) underline_changes.error = /*error*/ ctx[6];
    			underline.$set(underline_changes);

    			if (/*showHint*/ ctx[24]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*showHint*/ 16777216) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*wClasses*/ 2097152) {
    				attr_dev(div, "class", /*wClasses*/ ctx[21]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(underline.$$.fragment, local);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(underline.$$.fragment, local);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();

    			if (if_block1) {
    				if_block1.d();
    			}

    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(underline);
    			if (if_block4) if_block4.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$3 = "mt-2 mb-6 relative text-gray-600 dark:text-gray-100";
    const appendDefault = "absolute right-0 top-0 pb-2 pr-4 pt-4 text-gray-700 z-10";
    const prependDefault = "absolute left-0 top-0 pb-2 pl-2 pt-4 text-xs text-gray-700 z-10";

    function instance$8($$self, $$props, $$invalidate) {
    	let { outlined = false } = $$props;
    	let { value = null } = $$props;
    	let { label = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { hint = "" } = $$props;
    	let { error = false } = $$props;
    	let { append = "" } = $$props;
    	let { prepend = "" } = $$props;
    	let { persistentHint = false } = $$props;
    	let { textarea = false } = $$props;
    	let { rows = 5 } = $$props;
    	let { select = false } = $$props;
    	let { dense = false } = $$props;
    	let { autocomplete = false } = $$props;
    	let { noUnderline = false } = $$props;
    	let { appendReverse = false } = $$props;
    	let { prependReverse = false } = $$props;
    	let { color = "primary" } = $$props;
    	let { bgColor = "white" } = $$props;
    	let { iconClass = "" } = $$props;
    	let { disabled = false } = $$props;
    	const inputDefault = `duration-200 ease-in pb-2 pt-6 px-4 rounded-t text-black dark:text-gray-100 w-full`;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { inputClasses = inputDefault } = $$props;
    	let { classes = classesDefault$3 } = $$props;
    	let { appendClasses = appendDefault } = $$props;
    	let { prependClasses = prependDefault } = $$props;
    	const { bg, border, txt, caret } = utils(color);
    	const cb = new ClassBuilder(inputClasses, inputDefault);
    	const ccb = new ClassBuilder(classes, classesDefault$3);
    	const acb = new ClassBuilder(appendClasses, appendDefault);
    	const pcb = new ClassBuilder(prependClasses, prependDefault);

    	let { extend = () => {
    		
    	} } = $$props;

    	let { focused = false } = $$props;
    	let wClasses = i => i;
    	let aClasses = i => i;
    	let pClasses = i => i;

    	function toggleFocused() {
    		$$invalidate(1, focused = !focused);
    	}

    	const props = filterProps(
    		[
    			"outlined",
    			"label",
    			"placeholder",
    			"hint",
    			"error",
    			"append",
    			"prepend",
    			"persistentHint",
    			"textarea",
    			"rows",
    			"select",
    			"autocomplete",
    			"noUnderline",
    			"appendReverse",
    			"prependReverse",
    			"color",
    			"bgColor",
    			"disabled",
    			"replace",
    			"remove",
    			"small"
    		],
    		$$props
    	);

    	const dispatch = createEventDispatcher();
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TextField", $$slots, ['label','append','prepend']);

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function change_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_handler_2(event) {
    		bubble($$self, event);
    	}

    	function click_handler_2(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_2(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function textarea_1_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const click_handler_3 = () => dispatch("click-append");
    	const click_handler_4 = () => dispatch("click-prepend");

    	$$self.$set = $$new_props => {
    		$$invalidate(69, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("outlined" in $$new_props) $$invalidate(2, outlined = $$new_props.outlined);
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$new_props) $$invalidate(3, label = $$new_props.label);
    		if ("placeholder" in $$new_props) $$invalidate(4, placeholder = $$new_props.placeholder);
    		if ("hint" in $$new_props) $$invalidate(5, hint = $$new_props.hint);
    		if ("error" in $$new_props) $$invalidate(6, error = $$new_props.error);
    		if ("append" in $$new_props) $$invalidate(7, append = $$new_props.append);
    		if ("prepend" in $$new_props) $$invalidate(8, prepend = $$new_props.prepend);
    		if ("persistentHint" in $$new_props) $$invalidate(31, persistentHint = $$new_props.persistentHint);
    		if ("textarea" in $$new_props) $$invalidate(9, textarea = $$new_props.textarea);
    		if ("rows" in $$new_props) $$invalidate(10, rows = $$new_props.rows);
    		if ("select" in $$new_props) $$invalidate(11, select = $$new_props.select);
    		if ("dense" in $$new_props) $$invalidate(12, dense = $$new_props.dense);
    		if ("autocomplete" in $$new_props) $$invalidate(13, autocomplete = $$new_props.autocomplete);
    		if ("noUnderline" in $$new_props) $$invalidate(14, noUnderline = $$new_props.noUnderline);
    		if ("appendReverse" in $$new_props) $$invalidate(15, appendReverse = $$new_props.appendReverse);
    		if ("prependReverse" in $$new_props) $$invalidate(16, prependReverse = $$new_props.prependReverse);
    		if ("color" in $$new_props) $$invalidate(17, color = $$new_props.color);
    		if ("bgColor" in $$new_props) $$invalidate(18, bgColor = $$new_props.bgColor);
    		if ("iconClass" in $$new_props) $$invalidate(19, iconClass = $$new_props.iconClass);
    		if ("disabled" in $$new_props) $$invalidate(20, disabled = $$new_props.disabled);
    		if ("add" in $$new_props) $$invalidate(32, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(33, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(34, replace = $$new_props.replace);
    		if ("inputClasses" in $$new_props) $$invalidate(35, inputClasses = $$new_props.inputClasses);
    		if ("classes" in $$new_props) $$invalidate(36, classes = $$new_props.classes);
    		if ("appendClasses" in $$new_props) $$invalidate(37, appendClasses = $$new_props.appendClasses);
    		if ("prependClasses" in $$new_props) $$invalidate(38, prependClasses = $$new_props.prependClasses);
    		if ("extend" in $$new_props) $$invalidate(39, extend = $$new_props.extend);
    		if ("focused" in $$new_props) $$invalidate(1, focused = $$new_props.focused);
    		if ("$$scope" in $$new_props) $$invalidate(60, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		utils,
    		ClassBuilder,
    		filterProps,
    		Icon,
    		Label,
    		Hint,
    		Underline,
    		outlined,
    		value,
    		label,
    		placeholder,
    		hint,
    		error,
    		append,
    		prepend,
    		persistentHint,
    		textarea,
    		rows,
    		select,
    		dense,
    		autocomplete,
    		noUnderline,
    		appendReverse,
    		prependReverse,
    		color,
    		bgColor,
    		iconClass,
    		disabled,
    		inputDefault,
    		classesDefault: classesDefault$3,
    		appendDefault,
    		prependDefault,
    		add,
    		remove,
    		replace,
    		inputClasses,
    		classes,
    		appendClasses,
    		prependClasses,
    		bg,
    		border,
    		txt,
    		caret,
    		cb,
    		ccb,
    		acb,
    		pcb,
    		extend,
    		focused,
    		wClasses,
    		aClasses,
    		pClasses,
    		toggleFocused,
    		props,
    		dispatch,
    		showHint,
    		labelOnTop,
    		iClasses
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(69, $$props = assign(assign({}, $$props), $$new_props));
    		if ("outlined" in $$props) $$invalidate(2, outlined = $$new_props.outlined);
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$props) $$invalidate(3, label = $$new_props.label);
    		if ("placeholder" in $$props) $$invalidate(4, placeholder = $$new_props.placeholder);
    		if ("hint" in $$props) $$invalidate(5, hint = $$new_props.hint);
    		if ("error" in $$props) $$invalidate(6, error = $$new_props.error);
    		if ("append" in $$props) $$invalidate(7, append = $$new_props.append);
    		if ("prepend" in $$props) $$invalidate(8, prepend = $$new_props.prepend);
    		if ("persistentHint" in $$props) $$invalidate(31, persistentHint = $$new_props.persistentHint);
    		if ("textarea" in $$props) $$invalidate(9, textarea = $$new_props.textarea);
    		if ("rows" in $$props) $$invalidate(10, rows = $$new_props.rows);
    		if ("select" in $$props) $$invalidate(11, select = $$new_props.select);
    		if ("dense" in $$props) $$invalidate(12, dense = $$new_props.dense);
    		if ("autocomplete" in $$props) $$invalidate(13, autocomplete = $$new_props.autocomplete);
    		if ("noUnderline" in $$props) $$invalidate(14, noUnderline = $$new_props.noUnderline);
    		if ("appendReverse" in $$props) $$invalidate(15, appendReverse = $$new_props.appendReverse);
    		if ("prependReverse" in $$props) $$invalidate(16, prependReverse = $$new_props.prependReverse);
    		if ("color" in $$props) $$invalidate(17, color = $$new_props.color);
    		if ("bgColor" in $$props) $$invalidate(18, bgColor = $$new_props.bgColor);
    		if ("iconClass" in $$props) $$invalidate(19, iconClass = $$new_props.iconClass);
    		if ("disabled" in $$props) $$invalidate(20, disabled = $$new_props.disabled);
    		if ("add" in $$props) $$invalidate(32, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(33, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(34, replace = $$new_props.replace);
    		if ("inputClasses" in $$props) $$invalidate(35, inputClasses = $$new_props.inputClasses);
    		if ("classes" in $$props) $$invalidate(36, classes = $$new_props.classes);
    		if ("appendClasses" in $$props) $$invalidate(37, appendClasses = $$new_props.appendClasses);
    		if ("prependClasses" in $$props) $$invalidate(38, prependClasses = $$new_props.prependClasses);
    		if ("extend" in $$props) $$invalidate(39, extend = $$new_props.extend);
    		if ("focused" in $$props) $$invalidate(1, focused = $$new_props.focused);
    		if ("wClasses" in $$props) $$invalidate(21, wClasses = $$new_props.wClasses);
    		if ("aClasses" in $$props) $$invalidate(22, aClasses = $$new_props.aClasses);
    		if ("pClasses" in $$props) $$invalidate(23, pClasses = $$new_props.pClasses);
    		if ("showHint" in $$props) $$invalidate(24, showHint = $$new_props.showHint);
    		if ("labelOnTop" in $$props) $$invalidate(25, labelOnTop = $$new_props.labelOnTop);
    		if ("iClasses" in $$props) $$invalidate(26, iClasses = $$new_props.iClasses);
    	};

    	let showHint;
    	let labelOnTop;
    	let iClasses;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*error, hint, focused*/ 98 | $$self.$$.dirty[1] & /*persistentHint*/ 1) {
    			 $$invalidate(24, showHint = error || (persistentHint ? hint : focused && hint));
    		}

    		if ($$self.$$.dirty[0] & /*placeholder, focused, value*/ 19) {
    			 $$invalidate(25, labelOnTop = placeholder || focused || (value || value === 0));
    		}

    		 $$invalidate(26, iClasses = cb.flush().remove("pt-6 pb-2", outlined).add("border rounded bg-transparent py-4 duration-200 ease-in", outlined).add("border-error-500 caret-error-500", error).remove(caret(), error).add(caret(), !error).add(border(), focused && !error).add("border-gray-600", !error && !focused).add("bg-gray-100 dark:bg-dark-600", !outlined).add("bg-gray-300 dark:bg-dark-200", focused && !outlined).remove("px-4", prepend).add("pr-4 pl-10", prepend).add(add).remove("pt-6 pb-2", dense && !outlined).add("pt-4 pb-1", dense && !outlined).remove("bg-gray-100", disabled).add("bg-gray-50", disabled).add("cursor-pointer", select && !autocomplete).add($$props.class).remove(remove).replace(replace).extend(extend).get());

    		if ($$self.$$.dirty[0] & /*select, autocomplete, dense, outlined, error, disabled*/ 1062980) {
    			 $$invalidate(21, wClasses = ccb.flush().add("select", select || autocomplete).add("dense", dense && !outlined).remove("mb-6 mt-2", dense && !outlined).add("mb-4 mt-1", dense).replace({ "text-gray-600": "text-error-500" }, error).add("text-gray-200", disabled).get());
    		}
    	};

    	 $$invalidate(22, aClasses = acb.flush().get());
    	 $$invalidate(23, pClasses = pcb.flush().get());
    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		focused,
    		outlined,
    		label,
    		placeholder,
    		hint,
    		error,
    		append,
    		prepend,
    		textarea,
    		rows,
    		select,
    		dense,
    		autocomplete,
    		noUnderline,
    		appendReverse,
    		prependReverse,
    		color,
    		bgColor,
    		iconClass,
    		disabled,
    		wClasses,
    		aClasses,
    		pClasses,
    		showHint,
    		labelOnTop,
    		iClasses,
    		txt,
    		toggleFocused,
    		props,
    		dispatch,
    		persistentHint,
    		add,
    		remove,
    		replace,
    		inputClasses,
    		classes,
    		appendClasses,
    		prependClasses,
    		extend,
    		$$slots,
    		blur_handler,
    		change_handler,
    		input_handler,
    		click_handler,
    		focus_handler,
    		change_handler_1,
    		input_handler_1,
    		click_handler_1,
    		focus_handler_1,
    		blur_handler_1,
    		change_handler_2,
    		input_handler_2,
    		click_handler_2,
    		blur_handler_2,
    		focus_handler_2,
    		input_input_handler,
    		textarea_1_input_handler,
    		click_handler_3,
    		click_handler_4,
    		$$scope
    	];
    }

    class TextField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$8,
    			create_fragment$8,
    			safe_not_equal,
    			{
    				outlined: 2,
    				value: 0,
    				label: 3,
    				placeholder: 4,
    				hint: 5,
    				error: 6,
    				append: 7,
    				prepend: 8,
    				persistentHint: 31,
    				textarea: 9,
    				rows: 10,
    				select: 11,
    				dense: 12,
    				autocomplete: 13,
    				noUnderline: 14,
    				appendReverse: 15,
    				prependReverse: 16,
    				color: 17,
    				bgColor: 18,
    				iconClass: 19,
    				disabled: 20,
    				add: 32,
    				remove: 33,
    				replace: 34,
    				inputClasses: 35,
    				classes: 36,
    				appendClasses: 37,
    				prependClasses: 38,
    				extend: 39,
    				focused: 1
    			},
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextField",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get outlined() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get append() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set append(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prepend() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prepend(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get persistentHint() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set persistentHint(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textarea() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textarea(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rows() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set select(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autocomplete() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autocomplete(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noUnderline() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noUnderline(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get appendReverse() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appendReverse(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prependReverse() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prependReverse(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconClass() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconClass(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputClasses() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputClasses(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get appendClasses() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appendClasses(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prependClasses() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prependClasses(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get extend() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extend(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focused() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focused(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* node_modules\smelte\src\components\Checkbox\Label.svelte generated by Svelte v3.24.0 */
    const file$9 = "node_modules\\smelte\\src\\components\\Checkbox\\Label.svelte";

    // (27:8) {label}
    function fallback_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*label*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$3.name,
    		type: "fallback",
    		source: "(27:8) {label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let label_1;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	const default_slot_or_fallback = default_slot || fallback_block$3(ctx);
    	let label_1_levels = [{ "aria-hidden": "true" }, /*$$props*/ ctx[2], { class: /*c*/ ctx[1] }];
    	let label_1_data = {};

    	for (let i = 0; i < label_1_levels.length; i += 1) {
    		label_1_data = assign(label_1_data, label_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			set_attributes(label_1, label_1_data);
    			add_location(label_1, file$9, 21, 0, 520);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(label_1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*label*/ 1) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			set_attributes(label_1, label_1_data = get_spread_update(label_1_levels, [
    				{ "aria-hidden": "true" },
    				dirty & /*$$props*/ 4 && /*$$props*/ ctx[2],
    				(!current || dirty & /*c*/ 2) && { class: /*c*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$4 = "pl-2 cursor-pointer 'text-gray-700 dark:text-gray-300'";

    function instance$9($$self, $$props, $$invalidate) {
    	let { classes = classesDefault$4 } = $$props;
    	let { label = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { disabledClasses = "text-gray-500 dark:text-gray-600" } = $$props;
    	const cb = new ClassBuilder(classes, classesDefault$4);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Label", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("classes" in $$new_props) $$invalidate(3, classes = $$new_props.classes);
    		if ("label" in $$new_props) $$invalidate(0, label = $$new_props.label);
    		if ("disabled" in $$new_props) $$invalidate(4, disabled = $$new_props.disabled);
    		if ("disabledClasses" in $$new_props) $$invalidate(5, disabledClasses = $$new_props.disabledClasses);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		classesDefault: classesDefault$4,
    		classes,
    		label,
    		disabled,
    		disabledClasses,
    		cb,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
    		if ("label" in $$props) $$invalidate(0, label = $$new_props.label);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$new_props.disabled);
    		if ("disabledClasses" in $$props) $$invalidate(5, disabledClasses = $$new_props.disabledClasses);
    		if ("c" in $$props) $$invalidate(1, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(1, c = cb.flush().add(classes, true, classesDefault$4).add(disabledClasses, disabled).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);
    	return [label, c, $$props, classes, disabled, disabledClasses, $$scope, $$slots];
    }

    class Label$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			classes: 3,
    			label: 0,
    			disabled: 4,
    			disabledClasses: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get classes() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabledClasses() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabledClasses(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\Ripple\Ripple.svelte generated by Svelte v3.24.0 */
    const file$a = "node_modules\\smelte\\src\\components\\Ripple\\Ripple.svelte";

    function create_fragment$a(ctx) {
    	let span;
    	let span_class_value;
    	let ripple_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", span_class_value = "z-40 " + /*$$props*/ ctx[3].class + " p-2 rounded-full flex items-center justify-center top-0 left-0 " + (/*noHover*/ ctx[0] ? "" : /*hoverClass*/ ctx[2]) + " svelte-1o8z87d");
    			add_location(span, file$a, 15, 0, 293);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(ripple_action = /*ripple*/ ctx[1].call(null, span));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*$$props, noHover, hoverClass*/ 13 && span_class_value !== (span_class_value = "z-40 " + /*$$props*/ ctx[3].class + " p-2 rounded-full flex items-center justify-center top-0 left-0 " + (/*noHover*/ ctx[0] ? "" : /*hoverClass*/ ctx[2]) + " svelte-1o8z87d")) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { color = "primary" } = $$props;
    	let { noHover = false } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Ripple", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("noHover" in $$new_props) $$invalidate(0, noHover = $$new_props.noHover);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		color,
    		noHover,
    		createRipple: r,
    		ripple,
    		hoverClass
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    		if ("noHover" in $$props) $$invalidate(0, noHover = $$new_props.noHover);
    		if ("ripple" in $$props) $$invalidate(1, ripple = $$new_props.ripple);
    		if ("hoverClass" in $$props) $$invalidate(2, hoverClass = $$new_props.hoverClass);
    	};

    	let ripple;
    	let hoverClass;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 16) {
    			 $$invalidate(1, ripple = r(color, true));
    		}

    		if ($$self.$$.dirty & /*color*/ 16) {
    			 $$invalidate(2, hoverClass = `hover:bg-${color}-transLight`);
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [noHover, ripple, hoverClass, $$props, color, $$scope, $$slots];
    }

    class Ripple extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { color: 4, noHover: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ripple",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get color() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noHover() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noHover(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\Checkbox\Checkbox.svelte generated by Svelte v3.24.0 */
    const file$b = "node_modules\\smelte\\src\\components\\Checkbox\\Checkbox.svelte";
    const get_label_slot_changes$1 = dirty => ({});
    const get_label_slot_context$1 = ctx => ({});

    // (48:8) {:else}
    function create_else_block$2(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				class: /*disabled*/ ctx[4]
    				? "text-gray-500 dark:text-gray-600"
    				: "text-gray-600 dark:text-gray-300",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*disabled*/ 16) icon_changes.class = /*disabled*/ ctx[4]
    			? "text-gray-500 dark:text-gray-600"
    			: "text-gray-600 dark:text-gray-300";

    			if (dirty & /*$$scope*/ 16384) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(48:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (46:8) {#if checked}
    function create_if_block$4(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				class: /*disabled*/ ctx[4]
    				? "text-gray-500 dark:text-gray-600"
    				: `text-${/*color*/ ctx[3]}-500 dark:text-${/*color*/ ctx[3]}-100`,
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*disabled, color*/ 24) icon_changes.class = /*disabled*/ ctx[4]
    			? "text-gray-500 dark:text-gray-600"
    			: `text-${/*color*/ ctx[3]}-500 dark:text-${/*color*/ ctx[3]}-100`;

    			if (dirty & /*$$scope*/ 16384) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(46:8) {#if checked}",
    		ctx
    	});

    	return block;
    }

    // (49:10) <Icon class={disabled ? 'text-gray-500 dark:text-gray-600' : 'text-gray-600 dark:text-gray-300'}>
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("check_box_outline_blank");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(49:10) <Icon class={disabled ? 'text-gray-500 dark:text-gray-600' : 'text-gray-600 dark:text-gray-300'}>",
    		ctx
    	});

    	return block;
    }

    // (47:10) <Icon class={disabled ? 'text-gray-500 dark:text-gray-600' : `text-${color}-500 dark:text-${color}-100`}>
    function create_default_slot_1$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("check_box");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(47:10) <Icon class={disabled ? 'text-gray-500 dark:text-gray-600' : `text-${color}-500 dark:text-${color}-100`}>",
    		ctx
    	});

    	return block;
    }

    // (45:6) <Ripple color={rippleColor}>
    function create_default_slot$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*checked*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(45:6) <Ripple color={rippleColor}>",
    		ctx
    	});

    	return block;
    }

    // (55:23)        
    function fallback_block$4(ctx) {
    	let label_1;
    	let current;

    	label_1 = new Label$1({
    			props: {
    				disabled: /*disabled*/ ctx[4],
    				label: /*label*/ ctx[2],
    				class: /*labelClasses*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_1_changes = {};
    			if (dirty & /*disabled*/ 16) label_1_changes.disabled = /*disabled*/ ctx[4];
    			if (dirty & /*label*/ 4) label_1_changes.label = /*label*/ ctx[2];
    			if (dirty & /*labelClasses*/ 32) label_1_changes.class = /*labelClasses*/ ctx[5];
    			label_1.$set(label_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$4.name,
    		type: "fallback",
    		source: "(55:23)        ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let ripple;
    	let t1;
    	let div2_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	ripple = new Ripple({
    			props: {
    				color: /*rippleColor*/ ctx[6],
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const label_slot_template = /*$$slots*/ ctx[11].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[14], get_label_slot_context$1);
    	const label_slot_or_fallback = label_slot || fallback_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			create_component(ripple.$$.fragment);
    			t1 = space();
    			if (label_slot_or_fallback) label_slot_or_fallback.c();
    			attr_dev(input, "class", "hidden");
    			attr_dev(input, "type", "checkbox");
    			input.__value = /*value*/ ctx[1];
    			input.value = input.__value;
    			add_location(input, file$b, 42, 4, 970);
    			attr_dev(div0, "class", "relative w-auto h-auto z-0");
    			add_location(div0, file$b, 43, 4, 1046);
    			attr_dev(div1, "class", /*c*/ ctx[7]);
    			add_location(div1, file$b, 41, 2, 933);
    			attr_dev(div2, "class", div2_class_value = /*$$props*/ ctx[9].class);
    			add_location(div2, file$b, 40, 0, 903);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(ripple, div0, null);
    			append_dev(div1, t1);

    			if (label_slot_or_fallback) {
    				label_slot_or_fallback.m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[13]),
    					listen_dev(input, "change", /*change_handler*/ ctx[12], false, false, false),
    					listen_dev(div1, "click", /*check*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*value*/ 2) {
    				prop_dev(input, "__value", /*value*/ ctx[1]);
    				input.value = input.__value;
    			}

    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			const ripple_changes = {};
    			if (dirty & /*rippleColor*/ 64) ripple_changes.color = /*rippleColor*/ ctx[6];

    			if (dirty & /*$$scope, disabled, color, checked*/ 16409) {
    				ripple_changes.$$scope = { dirty, ctx };
    			}

    			ripple.$set(ripple_changes);

    			if (label_slot) {
    				if (label_slot.p && dirty & /*$$scope*/ 16384) {
    					update_slot(label_slot, label_slot_template, ctx, /*$$scope*/ ctx[14], dirty, get_label_slot_changes$1, get_label_slot_context$1);
    				}
    			} else {
    				if (label_slot_or_fallback && label_slot_or_fallback.p && dirty & /*disabled, label, labelClasses*/ 52) {
    					label_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty & /*c*/ 128) {
    				attr_dev(div1, "class", /*c*/ ctx[7]);
    			}

    			if (!current || dirty & /*$$props*/ 512 && div2_class_value !== (div2_class_value = /*$$props*/ ctx[9].class)) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ripple.$$.fragment, local);
    			transition_in(label_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ripple.$$.fragment, local);
    			transition_out(label_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(ripple);
    			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$5 = "inline-flex items-center mb-2 cursor-pointer z-10";

    function instance$b($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;
    	let { label = "" } = $$props;
    	let { color = "primary" } = $$props;
    	let { checked = false } = $$props;
    	let { disabled = false } = $$props;
    	let { classes = classesDefault$5 } = $$props;
    	let { labelClasses = i => i } = $$props;
    	const dispatch = createEventDispatcher();

    	function check() {
    		if (disabled) return;
    		$$invalidate(0, checked = !checked);
    		dispatch("change", checked);
    	}

    	const cb = new ClassBuilder(classes, classesDefault$5);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Checkbox", $$slots, ['label']);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(1, value = $$new_props.value);
    		if ("label" in $$new_props) $$invalidate(2, label = $$new_props.label);
    		if ("color" in $$new_props) $$invalidate(3, color = $$new_props.color);
    		if ("checked" in $$new_props) $$invalidate(0, checked = $$new_props.checked);
    		if ("disabled" in $$new_props) $$invalidate(4, disabled = $$new_props.disabled);
    		if ("classes" in $$new_props) $$invalidate(10, classes = $$new_props.classes);
    		if ("labelClasses" in $$new_props) $$invalidate(5, labelClasses = $$new_props.labelClasses);
    		if ("$$scope" in $$new_props) $$invalidate(14, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Label: Label$1,
    		createEventDispatcher,
    		ClassBuilder,
    		classesDefault: classesDefault$5,
    		Icon,
    		Ripple,
    		value,
    		label,
    		color,
    		checked,
    		disabled,
    		classes,
    		labelClasses,
    		dispatch,
    		check,
    		cb,
    		rippleColor,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(1, value = $$new_props.value);
    		if ("label" in $$props) $$invalidate(2, label = $$new_props.label);
    		if ("color" in $$props) $$invalidate(3, color = $$new_props.color);
    		if ("checked" in $$props) $$invalidate(0, checked = $$new_props.checked);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$new_props.disabled);
    		if ("classes" in $$props) $$invalidate(10, classes = $$new_props.classes);
    		if ("labelClasses" in $$props) $$invalidate(5, labelClasses = $$new_props.labelClasses);
    		if ("rippleColor" in $$props) $$invalidate(6, rippleColor = $$new_props.rippleColor);
    		if ("c" in $$props) $$invalidate(7, c = $$new_props.c);
    	};

    	let rippleColor;
    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*checked, disabled, color*/ 25) {
    			 $$invalidate(6, rippleColor = checked && !disabled ? color : "gray");
    		}

    		 $$invalidate(7, c = cb.flush().add(classes, true, classesDefault$5).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		checked,
    		value,
    		label,
    		color,
    		disabled,
    		labelClasses,
    		rippleColor,
    		c,
    		check,
    		$$props,
    		classes,
    		$$slots,
    		change_handler,
    		input_change_handler,
    		$$scope
    	];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			value: 1,
    			label: 2,
    			color: 3,
    			checked: 0,
    			disabled: 4,
    			classes: 10,
    			labelClasses: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get value() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelClasses() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelClasses(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function hideListAction(node, cb) {
      const onWindowClick = e => {
        if (!node.contains(e.target)) {
          cb();
        }
      };

      window.addEventListener("click", onWindowClick);

      return {
        destroy: () => {
          window.removeEventListener("click", onWindowClick);
        }
      };
    }

    /* node_modules\smelte\src\components\Select\Select.svelte generated by Svelte v3.24.0 */
    const file$c = "node_modules\\smelte\\src\\components\\Select\\Select.svelte";
    const get_options_slot_changes = dirty => ({});
    const get_options_slot_context = ctx => ({});
    const get_select_slot_changes = dirty => ({});
    const get_select_slot_context = ctx => ({});

    // (114:22)      
    function fallback_block_1$2(ctx) {
    	let textfield;
    	let current;

    	textfield = new TextField({
    			props: {
    				select: true,
    				dense: /*dense*/ ctx[10],
    				focused: /*showList*/ ctx[1],
    				autocomplete: /*autocomplete*/ ctx[12],
    				value: /*selectedLabel*/ ctx[24],
    				outlined: /*outlined*/ ctx[5],
    				label: /*label*/ ctx[3],
    				placeholder: /*placeholder*/ ctx[6],
    				hint: /*hint*/ ctx[7],
    				error: /*error*/ ctx[8],
    				append: /*append*/ ctx[9],
    				persistentHint: /*persistentHint*/ ctx[11],
    				color: /*color*/ ctx[4],
    				add: /*add*/ ctx[21],
    				remove: /*remove*/ ctx[22],
    				replace: /*replace*/ ctx[23],
    				noUnderline: /*noUnderline*/ ctx[13],
    				class: /*inputWrapperClasses*/ ctx[14],
    				appendClasses: /*appendClasses*/ ctx[2],
    				labelClasses: /*labelClasses*/ ctx[15],
    				inputClasses: /*inputClasses*/ ctx[16],
    				prependClasses: /*prependClasses*/ ctx[17],
    				appendReverse: /*showList*/ ctx[1]
    			},
    			$$inline: true
    		});

    	textfield.$on("click", /*handleInputClick*/ ctx[30]);
    	textfield.$on("click-append", /*click_append_handler*/ ctx[39]);
    	textfield.$on("click", /*click_handler*/ ctx[40]);
    	textfield.$on("input", /*filterItems*/ ctx[29]);

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textfield_changes = {};
    			if (dirty[0] & /*dense*/ 1024) textfield_changes.dense = /*dense*/ ctx[10];
    			if (dirty[0] & /*showList*/ 2) textfield_changes.focused = /*showList*/ ctx[1];
    			if (dirty[0] & /*autocomplete*/ 4096) textfield_changes.autocomplete = /*autocomplete*/ ctx[12];
    			if (dirty[0] & /*selectedLabel*/ 16777216) textfield_changes.value = /*selectedLabel*/ ctx[24];
    			if (dirty[0] & /*outlined*/ 32) textfield_changes.outlined = /*outlined*/ ctx[5];
    			if (dirty[0] & /*label*/ 8) textfield_changes.label = /*label*/ ctx[3];
    			if (dirty[0] & /*placeholder*/ 64) textfield_changes.placeholder = /*placeholder*/ ctx[6];
    			if (dirty[0] & /*hint*/ 128) textfield_changes.hint = /*hint*/ ctx[7];
    			if (dirty[0] & /*error*/ 256) textfield_changes.error = /*error*/ ctx[8];
    			if (dirty[0] & /*append*/ 512) textfield_changes.append = /*append*/ ctx[9];
    			if (dirty[0] & /*persistentHint*/ 2048) textfield_changes.persistentHint = /*persistentHint*/ ctx[11];
    			if (dirty[0] & /*color*/ 16) textfield_changes.color = /*color*/ ctx[4];
    			if (dirty[0] & /*add*/ 2097152) textfield_changes.add = /*add*/ ctx[21];
    			if (dirty[0] & /*remove*/ 4194304) textfield_changes.remove = /*remove*/ ctx[22];
    			if (dirty[0] & /*replace*/ 8388608) textfield_changes.replace = /*replace*/ ctx[23];
    			if (dirty[0] & /*noUnderline*/ 8192) textfield_changes.noUnderline = /*noUnderline*/ ctx[13];
    			if (dirty[0] & /*inputWrapperClasses*/ 16384) textfield_changes.class = /*inputWrapperClasses*/ ctx[14];
    			if (dirty[0] & /*appendClasses*/ 4) textfield_changes.appendClasses = /*appendClasses*/ ctx[2];
    			if (dirty[0] & /*labelClasses*/ 32768) textfield_changes.labelClasses = /*labelClasses*/ ctx[15];
    			if (dirty[0] & /*inputClasses*/ 65536) textfield_changes.inputClasses = /*inputClasses*/ ctx[16];
    			if (dirty[0] & /*prependClasses*/ 131072) textfield_changes.prependClasses = /*prependClasses*/ ctx[17];
    			if (dirty[0] & /*showList*/ 2) textfield_changes.appendReverse = /*showList*/ ctx[1];
    			textfield.$set(textfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1$2.name,
    		type: "fallback",
    		source: "(114:22)      ",
    		ctx
    	});

    	return block;
    }

    // (146:2) {#if showList}
    function create_if_block$5(ctx) {
    	let current;
    	const options_slot_template = /*$$slots*/ ctx[38].options;
    	const options_slot = create_slot(options_slot_template, ctx, /*$$scope*/ ctx[37], get_options_slot_context);
    	const options_slot_or_fallback = options_slot || fallback_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (options_slot_or_fallback) options_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (options_slot_or_fallback) {
    				options_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (options_slot) {
    				if (options_slot.p && dirty[1] & /*$$scope*/ 64) {
    					update_slot(options_slot, options_slot_template, ctx, /*$$scope*/ ctx[37], dirty, get_options_slot_changes, get_options_slot_context);
    				}
    			} else {
    				if (options_slot_or_fallback && options_slot_or_fallback.p && dirty[0] & /*o, showList, listClasses, selectedClasses, itemClasses, dense, filteredItems, value*/ 169608195) {
    					options_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(options_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(options_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (options_slot_or_fallback) options_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(146:2) {#if showList}",
    		ctx
    	});

    	return block;
    }

    // (147:25)        
    function fallback_block$5(ctx) {
    	let div;
    	let list;
    	let updating_value;
    	let current;
    	let mounted;
    	let dispose;

    	function list_value_binding(value) {
    		/*list_value_binding*/ ctx[41].call(null, value);
    	}

    	let list_props = {
    		class: /*listClasses*/ ctx[18],
    		selectedClasses: /*selectedClasses*/ ctx[19],
    		itemClasses: /*itemClasses*/ ctx[20],
    		select: true,
    		dense: /*dense*/ ctx[10],
    		items: /*filteredItems*/ ctx[25]
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		list_props.value = /*value*/ ctx[0];
    	}

    	list = new List({ props: list_props, $$inline: true });
    	binding_callbacks.push(() => bind(list, "value", list_value_binding));
    	list.$on("change", /*change_handler*/ ctx[42]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(list.$$.fragment);
    			attr_dev(div, "class", /*o*/ ctx[27]);
    			add_location(div, file$c, 147, 6, 3674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(list, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[43], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const list_changes = {};
    			if (dirty[0] & /*listClasses*/ 262144) list_changes.class = /*listClasses*/ ctx[18];
    			if (dirty[0] & /*selectedClasses*/ 524288) list_changes.selectedClasses = /*selectedClasses*/ ctx[19];
    			if (dirty[0] & /*itemClasses*/ 1048576) list_changes.itemClasses = /*itemClasses*/ ctx[20];
    			if (dirty[0] & /*dense*/ 1024) list_changes.dense = /*dense*/ ctx[10];
    			if (dirty[0] & /*filteredItems*/ 33554432) list_changes.items = /*filteredItems*/ ctx[25];

    			if (!updating_value && dirty[0] & /*value*/ 1) {
    				updating_value = true;
    				list_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			list.$set(list_changes);

    			if (!current || dirty[0] & /*o*/ 134217728) {
    				attr_dev(div, "class", /*o*/ ctx[27]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(list);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$5.name,
    		type: "fallback",
    		source: "(147:25)        ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let t;
    	let hideListAction_action;
    	let current;
    	let mounted;
    	let dispose;
    	const select_slot_template = /*$$slots*/ ctx[38].select;
    	const select_slot = create_slot(select_slot_template, ctx, /*$$scope*/ ctx[37], get_select_slot_context);
    	const select_slot_or_fallback = select_slot || fallback_block_1$2(ctx);
    	let if_block = /*showList*/ ctx[1] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (select_slot_or_fallback) select_slot_or_fallback.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", /*c*/ ctx[26]);
    			add_location(div, file$c, 112, 0, 2940);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (select_slot_or_fallback) {
    				select_slot_or_fallback.m(div, null);
    			}

    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(hideListAction_action = hideListAction.call(null, div, /*onHideListPanel*/ ctx[31]));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (select_slot) {
    				if (select_slot.p && dirty[1] & /*$$scope*/ 64) {
    					update_slot(select_slot, select_slot_template, ctx, /*$$scope*/ ctx[37], dirty, get_select_slot_changes, get_select_slot_context);
    				}
    			} else {
    				if (select_slot_or_fallback && select_slot_or_fallback.p && dirty[0] & /*dense, showList, autocomplete, selectedLabel, outlined, label, placeholder, hint, error, append, persistentHint, color, add, remove, replace, noUnderline, inputWrapperClasses, appendClasses, labelClasses, inputClasses, prependClasses*/ 31719422) {
    					select_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (/*showList*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*showList*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*c*/ 67108864) {
    				attr_dev(div, "class", /*c*/ ctx[26]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select_slot_or_fallback, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select_slot_or_fallback, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (select_slot_or_fallback) select_slot_or_fallback.d(detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const optionsClassesDefault = "absolute left-0 bg-white rounded elevation-3 w-full z-20 dark:bg-dark-500";
    const classesDefault$6 = "cursor-pointer relative pb-4";

    function process(it) {
    	return it.map(i => typeof i !== "object" ? { value: i, text: i } : i);
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const noop = i => i;
    	let { items = [] } = $$props;
    	let { value = "" } = $$props;
    	const text = "";
    	let { label = "" } = $$props;
    	let { selectedLabel: selectedLabelProp = undefined } = $$props;
    	let { color = "primary" } = $$props;
    	let { outlined = false } = $$props;
    	let { placeholder = "" } = $$props;
    	let { hint = "" } = $$props;
    	let { error = false } = $$props;
    	let { append = "arrow_drop_down" } = $$props;
    	let { dense = false } = $$props;
    	let { persistentHint = false } = $$props;
    	let { autocomplete = false } = $$props;
    	let { noUnderline = false } = $$props;
    	let { showList = false } = $$props;
    	let { classes = classesDefault$6 } = $$props;
    	let { optionsClasses = optionsClassesDefault } = $$props;
    	let { inputWrapperClasses = noop } = $$props;
    	let { appendClasses = noop } = $$props;
    	let { labelClasses = noop } = $$props;
    	let { inputClasses = noop } = $$props;
    	let { prependClasses = noop } = $$props;
    	let { listClasses = noop } = $$props;
    	let { selectedClasses = noop } = $$props;
    	let { itemClasses = noop } = $$props;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let itemsProcessed = [];
    	const dispatch = createEventDispatcher();
    	let selectedLabel = "";
    	let filterText = null;

    	function filterItems({ target }) {
    		$$invalidate(45, filterText = target.value.toLowerCase());
    	}

    	function handleInputClick() {
    		if (autocomplete) {
    			$$invalidate(1, showList = true);
    		} else {
    			$$invalidate(1, showList = !showList);
    		}
    	}

    	const onHideListPanel = () => $$invalidate(1, showList = false);
    	const cb = new ClassBuilder(classes, classesDefault$6);
    	const ocb = new ClassBuilder(optionsClasses, optionsClassesDefault);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Select", $$slots, ['select','options']);
    	const click_append_handler = e => $$invalidate(1, showList = !showList);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function list_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	const change_handler = ({ detail }) => {
    		dispatch("change", detail);
    	};

    	const click_handler_1 = () => $$invalidate(1, showList = false);

    	$$self.$set = $$new_props => {
    		$$invalidate(49, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("items" in $$new_props) $$invalidate(32, items = $$new_props.items);
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$new_props) $$invalidate(3, label = $$new_props.label);
    		if ("selectedLabel" in $$new_props) $$invalidate(34, selectedLabelProp = $$new_props.selectedLabel);
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("outlined" in $$new_props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("placeholder" in $$new_props) $$invalidate(6, placeholder = $$new_props.placeholder);
    		if ("hint" in $$new_props) $$invalidate(7, hint = $$new_props.hint);
    		if ("error" in $$new_props) $$invalidate(8, error = $$new_props.error);
    		if ("append" in $$new_props) $$invalidate(9, append = $$new_props.append);
    		if ("dense" in $$new_props) $$invalidate(10, dense = $$new_props.dense);
    		if ("persistentHint" in $$new_props) $$invalidate(11, persistentHint = $$new_props.persistentHint);
    		if ("autocomplete" in $$new_props) $$invalidate(12, autocomplete = $$new_props.autocomplete);
    		if ("noUnderline" in $$new_props) $$invalidate(13, noUnderline = $$new_props.noUnderline);
    		if ("showList" in $$new_props) $$invalidate(1, showList = $$new_props.showList);
    		if ("classes" in $$new_props) $$invalidate(35, classes = $$new_props.classes);
    		if ("optionsClasses" in $$new_props) $$invalidate(36, optionsClasses = $$new_props.optionsClasses);
    		if ("inputWrapperClasses" in $$new_props) $$invalidate(14, inputWrapperClasses = $$new_props.inputWrapperClasses);
    		if ("appendClasses" in $$new_props) $$invalidate(2, appendClasses = $$new_props.appendClasses);
    		if ("labelClasses" in $$new_props) $$invalidate(15, labelClasses = $$new_props.labelClasses);
    		if ("inputClasses" in $$new_props) $$invalidate(16, inputClasses = $$new_props.inputClasses);
    		if ("prependClasses" in $$new_props) $$invalidate(17, prependClasses = $$new_props.prependClasses);
    		if ("listClasses" in $$new_props) $$invalidate(18, listClasses = $$new_props.listClasses);
    		if ("selectedClasses" in $$new_props) $$invalidate(19, selectedClasses = $$new_props.selectedClasses);
    		if ("itemClasses" in $$new_props) $$invalidate(20, itemClasses = $$new_props.itemClasses);
    		if ("add" in $$new_props) $$invalidate(21, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(22, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(23, replace = $$new_props.replace);
    		if ("$$scope" in $$new_props) $$invalidate(37, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		quadOut,
    		quadIn,
    		List,
    		TextField,
    		ClassBuilder,
    		hideListAction,
    		optionsClassesDefault,
    		classesDefault: classesDefault$6,
    		noop,
    		items,
    		value,
    		text,
    		label,
    		selectedLabelProp,
    		color,
    		outlined,
    		placeholder,
    		hint,
    		error,
    		append,
    		dense,
    		persistentHint,
    		autocomplete,
    		noUnderline,
    		showList,
    		classes,
    		optionsClasses,
    		inputWrapperClasses,
    		appendClasses,
    		labelClasses,
    		inputClasses,
    		prependClasses,
    		listClasses,
    		selectedClasses,
    		itemClasses,
    		add,
    		remove,
    		replace,
    		itemsProcessed,
    		process,
    		dispatch,
    		selectedLabel,
    		filterText,
    		filterItems,
    		handleInputClick,
    		onHideListPanel,
    		cb,
    		ocb,
    		filteredItems,
    		c,
    		o
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(49, $$props = assign(assign({}, $$props), $$new_props));
    		if ("items" in $$props) $$invalidate(32, items = $$new_props.items);
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$props) $$invalidate(3, label = $$new_props.label);
    		if ("selectedLabelProp" in $$props) $$invalidate(34, selectedLabelProp = $$new_props.selectedLabelProp);
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("placeholder" in $$props) $$invalidate(6, placeholder = $$new_props.placeholder);
    		if ("hint" in $$props) $$invalidate(7, hint = $$new_props.hint);
    		if ("error" in $$props) $$invalidate(8, error = $$new_props.error);
    		if ("append" in $$props) $$invalidate(9, append = $$new_props.append);
    		if ("dense" in $$props) $$invalidate(10, dense = $$new_props.dense);
    		if ("persistentHint" in $$props) $$invalidate(11, persistentHint = $$new_props.persistentHint);
    		if ("autocomplete" in $$props) $$invalidate(12, autocomplete = $$new_props.autocomplete);
    		if ("noUnderline" in $$props) $$invalidate(13, noUnderline = $$new_props.noUnderline);
    		if ("showList" in $$props) $$invalidate(1, showList = $$new_props.showList);
    		if ("classes" in $$props) $$invalidate(35, classes = $$new_props.classes);
    		if ("optionsClasses" in $$props) $$invalidate(36, optionsClasses = $$new_props.optionsClasses);
    		if ("inputWrapperClasses" in $$props) $$invalidate(14, inputWrapperClasses = $$new_props.inputWrapperClasses);
    		if ("appendClasses" in $$props) $$invalidate(2, appendClasses = $$new_props.appendClasses);
    		if ("labelClasses" in $$props) $$invalidate(15, labelClasses = $$new_props.labelClasses);
    		if ("inputClasses" in $$props) $$invalidate(16, inputClasses = $$new_props.inputClasses);
    		if ("prependClasses" in $$props) $$invalidate(17, prependClasses = $$new_props.prependClasses);
    		if ("listClasses" in $$props) $$invalidate(18, listClasses = $$new_props.listClasses);
    		if ("selectedClasses" in $$props) $$invalidate(19, selectedClasses = $$new_props.selectedClasses);
    		if ("itemClasses" in $$props) $$invalidate(20, itemClasses = $$new_props.itemClasses);
    		if ("add" in $$props) $$invalidate(21, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(22, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(23, replace = $$new_props.replace);
    		if ("itemsProcessed" in $$props) $$invalidate(44, itemsProcessed = $$new_props.itemsProcessed);
    		if ("selectedLabel" in $$props) $$invalidate(24, selectedLabel = $$new_props.selectedLabel);
    		if ("filterText" in $$props) $$invalidate(45, filterText = $$new_props.filterText);
    		if ("filteredItems" in $$props) $$invalidate(25, filteredItems = $$new_props.filteredItems);
    		if ("c" in $$props) $$invalidate(26, c = $$new_props.c);
    		if ("o" in $$props) $$invalidate(27, o = $$new_props.o);
    	};

    	let filteredItems;
    	let c;
    	let o;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*items*/ 2) {
    			 $$invalidate(44, itemsProcessed = process(items));
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 1 | $$self.$$.dirty[1] & /*selectedLabelProp, itemsProcessed*/ 8200) {
    			 {
    				if (selectedLabelProp !== undefined) {
    					$$invalidate(24, selectedLabel = selectedLabelProp);
    				} else if (value !== undefined) {
    					let selectedItem = itemsProcessed.find(i => i.value === value);
    					$$invalidate(24, selectedLabel = selectedItem ? selectedItem.text : "");
    				} else {
    					$$invalidate(24, selectedLabel = "");
    				}
    			}
    		}

    		if ($$self.$$.dirty[1] & /*itemsProcessed, filterText*/ 24576) {
    			 $$invalidate(25, filteredItems = itemsProcessed.filter(i => !filterText || i.text.toLowerCase().includes(filterText)));
    		}

    		 $$invalidate(26, c = cb.flush().add(classes, true, classesDefault$6).add($$props.class).get());

    		if ($$self.$$.dirty[0] & /*outlined*/ 32 | $$self.$$.dirty[1] & /*optionsClasses*/ 32) {
    			 $$invalidate(27, o = ocb.flush().add(optionsClasses, true, optionsClassesDefault).add("rounded-t-none", !outlined).get());
    		}

    		if ($$self.$$.dirty[0] & /*dense*/ 1024) {
    			 if (dense) {
    				$$invalidate(2, appendClasses = i => i.replace("pt-4", "pt-3"));
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		showList,
    		appendClasses,
    		label,
    		color,
    		outlined,
    		placeholder,
    		hint,
    		error,
    		append,
    		dense,
    		persistentHint,
    		autocomplete,
    		noUnderline,
    		inputWrapperClasses,
    		labelClasses,
    		inputClasses,
    		prependClasses,
    		listClasses,
    		selectedClasses,
    		itemClasses,
    		add,
    		remove,
    		replace,
    		selectedLabel,
    		filteredItems,
    		c,
    		o,
    		dispatch,
    		filterItems,
    		handleInputClick,
    		onHideListPanel,
    		items,
    		text,
    		selectedLabelProp,
    		classes,
    		optionsClasses,
    		$$scope,
    		$$slots,
    		click_append_handler,
    		click_handler,
    		list_value_binding,
    		change_handler,
    		click_handler_1
    	];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$c,
    			create_fragment$c,
    			safe_not_equal,
    			{
    				items: 32,
    				value: 0,
    				text: 33,
    				label: 3,
    				selectedLabel: 34,
    				color: 4,
    				outlined: 5,
    				placeholder: 6,
    				hint: 7,
    				error: 8,
    				append: 9,
    				dense: 10,
    				persistentHint: 11,
    				autocomplete: 12,
    				noUnderline: 13,
    				showList: 1,
    				classes: 35,
    				optionsClasses: 36,
    				inputWrapperClasses: 14,
    				appendClasses: 2,
    				labelClasses: 15,
    				inputClasses: 16,
    				prependClasses: 17,
    				listClasses: 18,
    				selectedClasses: 19,
    				itemClasses: 20,
    				add: 21,
    				remove: 22,
    				replace: 23
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get items() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		return this.$$.ctx[33];
    	}

    	set text(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedLabel() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedLabel(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get append() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set append(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get persistentHint() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set persistentHint(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autocomplete() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autocomplete(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noUnderline() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noUnderline(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showList() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showList(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get optionsClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set optionsClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputWrapperClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputWrapperClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get appendClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appendClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prependClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prependClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\ProgressLinear\ProgressLinear.svelte generated by Svelte v3.24.0 */
    const file$d = "node_modules\\smelte\\src\\components\\ProgressLinear\\ProgressLinear.svelte";

    function create_fragment$d(ctx) {
    	let div2;
    	let div0;
    	let div0_class_value;
    	let div0_style_value;
    	let t;
    	let div1;
    	let div1_class_value;
    	let div2_class_value;
    	let div2_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", div0_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute" + " svelte-mguqwa");

    			attr_dev(div0, "style", div0_style_value = /*progress*/ ctx[1]
    			? `width: ${/*progress*/ ctx[1]}%`
    			: "");

    			toggle_class(div0, "inc", !/*progress*/ ctx[1]);
    			toggle_class(div0, "transition", /*progress*/ ctx[1]);
    			add_location(div0, file$d, 56, 2, 987);
    			attr_dev(div1, "class", div1_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute dec" + " svelte-mguqwa");
    			toggle_class(div1, "hidden", /*progress*/ ctx[1]);
    			add_location(div1, file$d, 61, 2, 1145);
    			attr_dev(div2, "class", div2_class_value = "top-0 left-0 w-full h-1 bg-" + /*color*/ ctx[2] + "-100 overflow-hidden relative" + " svelte-mguqwa");
    			toggle_class(div2, "fixed", /*app*/ ctx[0]);
    			toggle_class(div2, "z-50", /*app*/ ctx[0]);
    			toggle_class(div2, "hidden", /*app*/ ctx[0] && !/*initialized*/ ctx[3]);
    			add_location(div2, file$d, 50, 0, 790);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*color*/ 4 && div0_class_value !== (div0_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute" + " svelte-mguqwa")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*progress*/ 2 && div0_style_value !== (div0_style_value = /*progress*/ ctx[1]
    			? `width: ${/*progress*/ ctx[1]}%`
    			: "")) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*color, progress*/ 6) {
    				toggle_class(div0, "inc", !/*progress*/ ctx[1]);
    			}

    			if (dirty & /*color, progress*/ 6) {
    				toggle_class(div0, "transition", /*progress*/ ctx[1]);
    			}

    			if (!current || dirty & /*color*/ 4 && div1_class_value !== (div1_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute dec" + " svelte-mguqwa")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*color, progress*/ 6) {
    				toggle_class(div1, "hidden", /*progress*/ ctx[1]);
    			}

    			if (!current || dirty & /*color*/ 4 && div2_class_value !== (div2_class_value = "top-0 left-0 w-full h-1 bg-" + /*color*/ ctx[2] + "-100 overflow-hidden relative" + " svelte-mguqwa")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (dirty & /*color, app*/ 5) {
    				toggle_class(div2, "fixed", /*app*/ ctx[0]);
    			}

    			if (dirty & /*color, app*/ 5) {
    				toggle_class(div2, "z-50", /*app*/ ctx[0]);
    			}

    			if (dirty & /*color, app, initialized*/ 13) {
    				toggle_class(div2, "hidden", /*app*/ ctx[0] && !/*initialized*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { app = false } = $$props;
    	let { progress = 0 } = $$props;
    	let { color = "primary" } = $$props;
    	let initialized = false;

    	onMount(() => {
    		if (!app) return;

    		setTimeout(
    			() => {
    				$$invalidate(3, initialized = true);
    			},
    			200
    		);
    	});

    	const writable_props = ["app", "progress", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProgressLinear> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ProgressLinear", $$slots, []);

    	$$self.$set = $$props => {
    		if ("app" in $$props) $$invalidate(0, app = $$props.app);
    		if ("progress" in $$props) $$invalidate(1, progress = $$props.progress);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		slide,
    		app,
    		progress,
    		color,
    		initialized
    	});

    	$$self.$inject_state = $$props => {
    		if ("app" in $$props) $$invalidate(0, app = $$props.app);
    		if ("progress" in $$props) $$invalidate(1, progress = $$props.progress);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("initialized" in $$props) $$invalidate(3, initialized = $$props.initialized);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [app, progress, color, initialized];
    }

    class ProgressLinear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { app: 0, progress: 1, color: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressLinear",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get app() {
    		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set app(value) {
    		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get progress() {
    		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set progress(value) {
    		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\Snackbar\Snackbar.svelte generated by Svelte v3.24.0 */
    const file$e = "node_modules\\smelte\\src\\components\\Snackbar\\Snackbar.svelte";
    const get_action_slot_changes = dirty => ({});
    const get_action_slot_context = ctx => ({});

    // (112:0) {#if value && (running === hash)}
    function create_if_block$6(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let div0_intro;
    	let div0_outro;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);
    	let if_block = !/*noAction*/ ctx[5] && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			add_location(div0, file$e, 116, 6, 2707);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*wClasses*/ ctx[6]) + " svelte-1ym8qvd"));
    			add_location(div1, file$e, 115, 4, 2678);
    			attr_dev(div2, "class", "fixed w-full h-full top-0 left-0 z-30 pointer-events-none");
    			add_location(div2, file$e, 112, 2, 2595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			append_dev(div0, t);
    			if (if_block) if_block.m(div0, null);
    			/*div0_binding*/ ctx[17](div0);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler_1*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			if (!/*noAction*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*noAction*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*wClasses*/ 64 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*wClasses*/ ctx[6]) + " svelte-1ym8qvd"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				if (!div0_intro) div0_intro = create_in_transition(div0, scale, /*inProps*/ ctx[3]);
    				div0_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, /*outProps*/ ctx[4]);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    			/*div0_binding*/ ctx[17](null);
    			if (detaching && div0_outro) div0_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(112:0) {#if value && (running === hash)}",
    		ctx
    	});

    	return block;
    }

    // (123:8) {#if !noAction}
    function create_if_block_1$3(ctx) {
    	let spacer;
    	let t;
    	let current;
    	spacer = new Spacer$1({ $$inline: true });
    	const action_slot_template = /*$$slots*/ ctx[15].action;
    	const action_slot = create_slot(action_slot_template, ctx, /*$$scope*/ ctx[19], get_action_slot_context);
    	const action_slot_or_fallback = action_slot || fallback_block$6(ctx);

    	const block = {
    		c: function create() {
    			create_component(spacer.$$.fragment);
    			t = space();
    			if (action_slot_or_fallback) action_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			mount_component(spacer, target, anchor);
    			insert_dev(target, t, anchor);

    			if (action_slot_or_fallback) {
    				action_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (action_slot) {
    				if (action_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(action_slot, action_slot_template, ctx, /*$$scope*/ ctx[19], dirty, get_action_slot_changes, get_action_slot_context);
    				}
    			} else {
    				if (action_slot_or_fallback && action_slot_or_fallback.p && dirty & /*value, timeout*/ 5) {
    					action_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spacer.$$.fragment, local);
    			transition_in(action_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spacer.$$.fragment, local);
    			transition_out(action_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spacer, detaching);
    			if (detaching) detach_dev(t);
    			if (action_slot_or_fallback) action_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(123:8) {#if !noAction}",
    		ctx
    	});

    	return block;
    }

    // (126:12) {#if !timeout}
    function create_if_block_2$2(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				text: true,
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[16]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 524288) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(126:12) {#if !timeout}",
    		ctx
    	});

    	return block;
    }

    // (127:14) <Button text on:click={() => value = false}>
    function create_default_slot$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Close");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(127:14) <Button text on:click={() => value = false}>",
    		ctx
    	});

    	return block;
    }

    // (125:30)              
    function fallback_block$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*timeout*/ ctx[2] && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*timeout*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*timeout*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$6.name,
    		type: "fallback",
    		source: "(125:30)              ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*value*/ ctx[0] && running === /*hash*/ ctx[1] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*value*/ ctx[0] && running === /*hash*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*value, running, hash*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const queue = writable([]);
    let running = false;
    const wrapperDefault = "fixed w-full h-full flex items-center justify-center pointer-events-none";

    function instance$e($$self, $$props, $$invalidate) {
    	let $queue;
    	validate_store(queue, "queue");
    	component_subscribe($$self, queue, $$value => $$invalidate(23, $queue = $$value));
    	let { value = false } = $$props;
    	let { timeout = 2000 } = $$props;
    	let { inProps = { duration: 100, easing: quadIn } } = $$props;

    	let { outProps = {
    		duration: 100,
    		easing: quadOut,
    		delay: 150
    	} } = $$props;

    	let { color = "gray" } = $$props;
    	let { text = "white" } = $$props;
    	let { top = false } = $$props;
    	let { bottom = true } = $$props;
    	let { right = false } = $$props;
    	let { left = false } = $$props;
    	let { noAction = true } = $$props;
    	let { hash = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const classesDefault = `pointer-events-auto flex absolute py-2 px-4 z-30 mb-4 content-between mx-auto
      rounded items-center elevation-2 h-12`;

    	let { classes = wrapperDefault } = $$props;
    	const cb = new ClassBuilder($$props.class, classesDefault);
    	const wrapperCb = new ClassBuilder(classes, wrapperDefault);
    	let wClasses = i => i;
    	let tm;
    	let node;

    	let bg = () => {
    		
    	};

    	function toggle(h, id) {
    		if (value === false && running === false) {
    			return;
    		}

    		$$invalidate(1, hash = running = $$invalidate(0, value = id));
    		if (!timeout) return;

    		$$invalidate(20, tm = setTimeout(
    			() => {
    				$$invalidate(0, value = running = $$invalidate(1, hash = false));
    				dispatch("finish");

    				if ($queue.length) {
    					$queue.shift()();
    				}
    			},
    			timeout
    		));
    	}

    	wClasses = wrapperCb.flush().add(`text-${text}`).get();
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Snackbar", $$slots, ['default','action']);
    	const click_handler = () => $$invalidate(0, value = false);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			node = $$value;
    			(((((((($$invalidate(7, node), $$invalidate(24, c)), $$invalidate(21, bg)), $$invalidate(8, color)), $$invalidate(12, right)), $$invalidate(10, top)), $$invalidate(13, left)), $$invalidate(11, bottom)), $$invalidate(5, noAction));
    		});
    	}

    	const click_handler_1 = () => $$invalidate(0, value = false);

    	$$self.$set = $$new_props => {
    		$$invalidate(30, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("timeout" in $$new_props) $$invalidate(2, timeout = $$new_props.timeout);
    		if ("inProps" in $$new_props) $$invalidate(3, inProps = $$new_props.inProps);
    		if ("outProps" in $$new_props) $$invalidate(4, outProps = $$new_props.outProps);
    		if ("color" in $$new_props) $$invalidate(8, color = $$new_props.color);
    		if ("text" in $$new_props) $$invalidate(9, text = $$new_props.text);
    		if ("top" in $$new_props) $$invalidate(10, top = $$new_props.top);
    		if ("bottom" in $$new_props) $$invalidate(11, bottom = $$new_props.bottom);
    		if ("right" in $$new_props) $$invalidate(12, right = $$new_props.right);
    		if ("left" in $$new_props) $$invalidate(13, left = $$new_props.left);
    		if ("noAction" in $$new_props) $$invalidate(5, noAction = $$new_props.noAction);
    		if ("hash" in $$new_props) $$invalidate(1, hash = $$new_props.hash);
    		if ("classes" in $$new_props) $$invalidate(14, classes = $$new_props.classes);
    		if ("$$scope" in $$new_props) $$invalidate(19, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		queue,
    		running,
    		fade,
    		scale,
    		createEventDispatcher,
    		quadOut,
    		quadIn,
    		Button,
    		Spacer: Spacer$1,
    		utils,
    		ClassBuilder,
    		value,
    		timeout,
    		inProps,
    		outProps,
    		color,
    		text,
    		top,
    		bottom,
    		right,
    		left,
    		noAction,
    		hash,
    		dispatch,
    		classesDefault,
    		wrapperDefault,
    		classes,
    		cb,
    		wrapperCb,
    		wClasses,
    		tm,
    		node,
    		bg,
    		toggle,
    		toggler,
    		$queue,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(30, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("timeout" in $$props) $$invalidate(2, timeout = $$new_props.timeout);
    		if ("inProps" in $$props) $$invalidate(3, inProps = $$new_props.inProps);
    		if ("outProps" in $$props) $$invalidate(4, outProps = $$new_props.outProps);
    		if ("color" in $$props) $$invalidate(8, color = $$new_props.color);
    		if ("text" in $$props) $$invalidate(9, text = $$new_props.text);
    		if ("top" in $$props) $$invalidate(10, top = $$new_props.top);
    		if ("bottom" in $$props) $$invalidate(11, bottom = $$new_props.bottom);
    		if ("right" in $$props) $$invalidate(12, right = $$new_props.right);
    		if ("left" in $$props) $$invalidate(13, left = $$new_props.left);
    		if ("noAction" in $$props) $$invalidate(5, noAction = $$new_props.noAction);
    		if ("hash" in $$props) $$invalidate(1, hash = $$new_props.hash);
    		if ("classes" in $$props) $$invalidate(14, classes = $$new_props.classes);
    		if ("wClasses" in $$props) $$invalidate(6, wClasses = $$new_props.wClasses);
    		if ("tm" in $$props) $$invalidate(20, tm = $$new_props.tm);
    		if ("node" in $$props) $$invalidate(7, node = $$new_props.node);
    		if ("bg" in $$props) $$invalidate(21, bg = $$new_props.bg);
    		if ("toggler" in $$props) $$invalidate(22, toggler = $$new_props.toggler);
    		if ("c" in $$props) $$invalidate(24, c = $$new_props.c);
    	};

    	let toggler;
    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 256) {
    			 {
    				const u = utils(color || "gray");
    				$$invalidate(21, bg = u.bg);
    			}
    		}

    		if ($$self.$$.dirty & /*hash, value*/ 3) {
    			 {
    				$$invalidate(1, hash = hash || (value ? btoa(`${value}${new Date().valueOf()}`) : null));
    				($$invalidate(0, value), $$invalidate(1, hash));
    			}
    		}

    		if ($$self.$$.dirty & /*value, hash*/ 3) {
    			 $$invalidate(22, toggler = () => toggle(value, hash));
    		}

    		if ($$self.$$.dirty & /*value, toggler*/ 4194305) {
    			 if (value) {
    				queue.update(u => [...u, toggler]);
    			}
    		}

    		if ($$self.$$.dirty & /*running, value, $queue*/ 8388609) {
    			 if (!running && value && $queue.length) {
    				$queue.shift()();
    			}
    		}

    		if ($$self.$$.dirty & /*value, tm*/ 1048577) {
    			 if (!value) clearTimeout(tm);
    		}

    		if ($$self.$$.dirty & /*bg, color, right, top, left, bottom, noAction*/ 2112800) {
    			 $$invalidate(24, c = cb.flush().add(bg(800), color).add("right-0 mr-2", right).add("top-0 mt-2", top).add("left-0 ml-2", left).add("bottom-0", bottom).add("snackbar", !noAction).get());
    		}

    		if ($$self.$$.dirty & /*node, c*/ 16777344) {
    			// for some reason it doesn't get updated otherwise
    			 if (node) $$invalidate(7, node.classList = c, node);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		hash,
    		timeout,
    		inProps,
    		outProps,
    		noAction,
    		wClasses,
    		node,
    		color,
    		text,
    		top,
    		bottom,
    		right,
    		left,
    		classes,
    		$$slots,
    		click_handler,
    		div0_binding,
    		click_handler_1,
    		$$scope
    	];
    }

    class Snackbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			value: 0,
    			timeout: 2,
    			inProps: 3,
    			outProps: 4,
    			color: 8,
    			text: 9,
    			top: 10,
    			bottom: 11,
    			right: 12,
    			left: 13,
    			noAction: 5,
    			hash: 1,
    			classes: 14
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snackbar",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get value() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeout() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeout(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inProps() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inProps(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outProps() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outProps(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noAction() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noAction(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hash() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hash(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\DataTable\Header.svelte generated by Svelte v3.24.0 */
    const file$f = "node_modules\\smelte\\src\\components\\DataTable\\Header.svelte";

    // (61:4) {#if sortable && column.sortable !== false && !column.iconAfter}
    function create_if_block_1$4(ctx) {
    	let span;
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				small: true,
    				color: "text-gray-400 dark:text-gray-100",
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon.$$.fragment);
    			attr_dev(span, "class", "sort svelte-1qy4u3g");
    			toggle_class(span, "asc", !/*asc*/ ctx[0] && /*sortBy*/ ctx[1] === /*column*/ ctx[3]);
    			add_location(span, file$f, 61, 6, 1498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);

    			if (dirty & /*asc, sortBy, column*/ 11) {
    				toggle_class(span, "asc", !/*asc*/ ctx[0] && /*sortBy*/ ctx[1] === /*column*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(61:4) {#if sortable && column.sortable !== false && !column.iconAfter}",
    		ctx
    	});

    	return block;
    }

    // (63:8) <Icon small color="text-gray-400 dark:text-gray-100">
    function create_default_slot_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("arrow_downward");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(63:8) <Icon small color=\\\"text-gray-400 dark:text-gray-100\\\">",
    		ctx
    	});

    	return block;
    }

    // (67:4) {#if sortable && column.sortable !== false && !!column.iconAfter}
    function create_if_block$7(ctx) {
    	let span;
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				small: true,
    				color: "text-gray-400 dark:text-gray-100",
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon.$$.fragment);
    			attr_dev(span, "class", "sort svelte-1qy4u3g");
    			toggle_class(span, "asc", !/*asc*/ ctx[0] && /*sortBy*/ ctx[1] === /*column*/ ctx[3]);
    			add_location(span, file$f, 67, 6, 1787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);

    			if (dirty & /*asc, sortBy, column*/ 11) {
    				toggle_class(span, "asc", !/*asc*/ ctx[0] && /*sortBy*/ ctx[1] === /*column*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(67:4) {#if sortable && column.sortable !== false && !!column.iconAfter}",
    		ctx
    	});

    	return block;
    }

    // (69:8) <Icon small color="text-gray-400 dark:text-gray-100">
    function create_default_slot$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("arrow_downward");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(69:8) <Icon small color=\\\"text-gray-400 dark:text-gray-100\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let th;
    	let div;
    	let t0;
    	let span;
    	let t1_value = (/*column*/ ctx[3].label || /*column*/ ctx[3].field) + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let th_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*sortable*/ ctx[4] && /*column*/ ctx[3].sortable !== false && !/*column*/ ctx[3].iconAfter && create_if_block_1$4(ctx);
    	let if_block1 = /*sortable*/ ctx[4] && /*column*/ ctx[3].sortable !== false && !!/*column*/ ctx[3].iconAfter && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			th = element("th");
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$f, 65, 4, 1667);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*headerColumnClass*/ ctx[7](/*column*/ ctx[3])) + " svelte-1qy4u3g"));
    			add_location(div, file$f, 59, 2, 1383);
    			attr_dev(th, "class", th_class_value = "" + (null_to_empty(/*c*/ ctx[5]) + " svelte-1qy4u3g"));
    			toggle_class(th, "cursor-pointer", /*sortable*/ ctx[4] || /*column*/ ctx[3].sortable);
    			add_location(th, file$f, 47, 0, 1112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, div);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(th, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*sortable*/ ctx[4] && /*column*/ ctx[3].sortable !== false && !/*column*/ ctx[3].iconAfter) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*sortable, column*/ 24) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*column*/ 8) && t1_value !== (t1_value = (/*column*/ ctx[3].label || /*column*/ ctx[3].field) + "")) set_data_dev(t1, t1_value);

    			if (/*sortable*/ ctx[4] && /*column*/ ctx[3].sortable !== false && !!/*column*/ ctx[3].iconAfter) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*sortable, column*/ 24) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*column*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*headerColumnClass*/ ctx[7](/*column*/ ctx[3])) + " svelte-1qy4u3g"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*c*/ 32 && th_class_value !== (th_class_value = "" + (null_to_empty(/*c*/ ctx[5]) + " svelte-1qy4u3g"))) {
    				attr_dev(th, "class", th_class_value);
    			}

    			if (dirty & /*c, sortable, column*/ 56) {
    				toggle_class(th, "cursor-pointer", /*sortable*/ ctx[4] || /*column*/ ctx[3].sortable);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$7 = "capitalize duration-100 text-gray-600 text-xs hover:text-black dark-hover:text-white p-3 font-normal text-right";

    function instance$f($$self, $$props, $$invalidate) {
    	let { classes = classesDefault$7 } = $$props;
    	let { column = {} } = $$props;
    	let { asc = false } = $$props;
    	let { sortBy = false } = $$props;
    	let { sortable = true } = $$props;
    	let { editing = false } = $$props;
    	const dispatch = createEventDispatcher();
    	const cb = new ClassBuilder(classes, classesDefault$7);

    	function headerColumnClass(column) {
    		const cb = new ClassBuilder("sort-wrapper flex items-center justify-end");

    		if (column.headerReplace) {
    			cb.replace(column.headerReplace);
    		}

    		if (column.headerAdd) {
    			cb.add(column.headerAdd);
    		}

    		if (column.headerRemove) {
    			cb.remove(column.headerRemove);
    		}

    		return cb.get();
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);

    	const click_handler = () => {
    		if (column.sortable === false || !sortable) return;
    		dispatch("sort", column);
    		$$invalidate(2, editing = false);
    		$$invalidate(0, asc = sortBy === column ? !asc : false);
    		$$invalidate(1, sortBy = column);
    	};

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("classes" in $$new_props) $$invalidate(8, classes = $$new_props.classes);
    		if ("column" in $$new_props) $$invalidate(3, column = $$new_props.column);
    		if ("asc" in $$new_props) $$invalidate(0, asc = $$new_props.asc);
    		if ("sortBy" in $$new_props) $$invalidate(1, sortBy = $$new_props.sortBy);
    		if ("sortable" in $$new_props) $$invalidate(4, sortable = $$new_props.sortable);
    		if ("editing" in $$new_props) $$invalidate(2, editing = $$new_props.editing);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		createEventDispatcher,
    		Icon,
    		classesDefault: classesDefault$7,
    		classes,
    		column,
    		asc,
    		sortBy,
    		sortable,
    		editing,
    		dispatch,
    		cb,
    		headerColumnClass,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("classes" in $$props) $$invalidate(8, classes = $$new_props.classes);
    		if ("column" in $$props) $$invalidate(3, column = $$new_props.column);
    		if ("asc" in $$props) $$invalidate(0, asc = $$new_props.asc);
    		if ("sortBy" in $$props) $$invalidate(1, sortBy = $$new_props.sortBy);
    		if ("sortable" in $$props) $$invalidate(4, sortable = $$new_props.sortable);
    		if ("editing" in $$props) $$invalidate(2, editing = $$new_props.editing);
    		if ("c" in $$props) $$invalidate(5, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(5, c = cb.flush().add(classes, true, classesDefault$7).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		asc,
    		sortBy,
    		editing,
    		column,
    		sortable,
    		c,
    		dispatch,
    		headerColumnClass,
    		classes,
    		click_handler
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			classes: 8,
    			column: 3,
    			asc: 0,
    			sortBy: 1,
    			sortable: 4,
    			editing: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get classes() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get column() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set column(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get asc() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set asc(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sortBy() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sortBy(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sortable() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sortable(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editing() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editing(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\DataTable\Editable.svelte generated by Svelte v3.24.0 */
    const file$g = "node_modules\\smelte\\src\\components\\DataTable\\Editable.svelte";

    // (28:8)      
    function fallback_block$7(ctx) {
    	let textfield;
    	let current;

    	textfield = new TextField({
    			props: {
    				value: /*item*/ ctx[1][/*column*/ ctx[2].field],
    				textarea: /*column*/ ctx[2].textarea,
    				remove: "bg-gray-100 bg-gray-300"
    			},
    			$$inline: true
    		});

    	textfield.$on("change", /*change_handler*/ ctx[8]);
    	textfield.$on("blur", /*blur_handler*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(textfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textfield_changes = {};
    			if (dirty & /*item, column*/ 6) textfield_changes.value = /*item*/ ctx[1][/*column*/ ctx[2].field];
    			if (dirty & /*column*/ 4) textfield_changes.textarea = /*column*/ ctx[2].textarea;
    			textfield.$set(textfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$7.name,
    		type: "fallback",
    		source: "(28:8)      ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	const default_slot_or_fallback = default_slot || fallback_block$7(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(div, "class", /*c*/ ctx[3]);
    			set_style(div, "width", "300px");
    			add_location(div, file$g, 26, 0, 629);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*item, column, editing*/ 7) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty & /*c*/ 8) {
    				attr_dev(div, "class", /*c*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$8 = "absolute left-0 top-0 z-10 bg-white dark:bg-dark-400 p-2 elevation-3 rounded";

    function instance$g($$self, $$props, $$invalidate) {
    	let { item = {} } = $$props;
    	let { column = {} } = $$props;
    	let { editing = false } = $$props;
    	let { classes = classesDefault$8 } = $$props;
    	const dispatch = createEventDispatcher();
    	const cb = new ClassBuilder(classes, classesDefault$8);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Editable", $$slots, ['default']);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	const blur_handler = ({ target }) => {
    		$$invalidate(0, editing = false);
    		dispatch("update", { item, column, value: target.value });
    	};

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("item" in $$new_props) $$invalidate(1, item = $$new_props.item);
    		if ("column" in $$new_props) $$invalidate(2, column = $$new_props.column);
    		if ("editing" in $$new_props) $$invalidate(0, editing = $$new_props.editing);
    		if ("classes" in $$new_props) $$invalidate(5, classes = $$new_props.classes);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		createEventDispatcher,
    		TextField,
    		Icon,
    		classesDefault: classesDefault$8,
    		item,
    		column,
    		editing,
    		classes,
    		dispatch,
    		cb,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("item" in $$props) $$invalidate(1, item = $$new_props.item);
    		if ("column" in $$props) $$invalidate(2, column = $$new_props.column);
    		if ("editing" in $$props) $$invalidate(0, editing = $$new_props.editing);
    		if ("classes" in $$props) $$invalidate(5, classes = $$new_props.classes);
    		if ("c" in $$props) $$invalidate(3, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(3, c = cb.flush().add(classes, true, classesDefault$8).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		editing,
    		item,
    		column,
    		c,
    		dispatch,
    		classes,
    		$$scope,
    		$$slots,
    		change_handler,
    		blur_handler
    	];
    }

    class Editable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			item: 1,
    			column: 2,
    			editing: 0,
    			classes: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editable",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get item() {
    		throw new Error("<Editable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Editable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get column() {
    		throw new Error("<Editable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set column(value) {
    		throw new Error("<Editable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editing() {
    		throw new Error("<Editable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editing(value) {
    		throw new Error("<Editable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Editable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Editable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\DataTable\Row.svelte generated by Svelte v3.24.0 */
    const file$h = "node_modules\\smelte\\src\\components\\DataTable\\Row.svelte";
    const get_edit_dialog_slot_changes = dirty => ({});
    const get_edit_dialog_slot_context = ctx => ({});

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (59:6) {#if editable && column.editable !== false && editing[index] === i}
    function create_if_block_1$5(ctx) {
    	let current;
    	const edit_dialog_slot_template = /*$$slots*/ ctx[10]["edit-dialog"];
    	const edit_dialog_slot = create_slot(edit_dialog_slot_template, ctx, /*$$scope*/ ctx[9], get_edit_dialog_slot_context);
    	const edit_dialog_slot_or_fallback = edit_dialog_slot || fallback_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (edit_dialog_slot_or_fallback) edit_dialog_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (edit_dialog_slot_or_fallback) {
    				edit_dialog_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (edit_dialog_slot) {
    				if (edit_dialog_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(edit_dialog_slot, edit_dialog_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_edit_dialog_slot_changes, get_edit_dialog_slot_context);
    				}
    			} else {
    				if (edit_dialog_slot_or_fallback && edit_dialog_slot_or_fallback.p && dirty & /*editableClasses, columns, editing, item*/ 39) {
    					edit_dialog_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(edit_dialog_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(edit_dialog_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (edit_dialog_slot_or_fallback) edit_dialog_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(59:6) {#if editable && column.editable !== false && editing[index] === i}",
    		ctx
    	});

    	return block;
    }

    // (60:33)            
    function fallback_block$8(ctx) {
    	let editable_1;
    	let updating_editing;
    	let updating_item;
    	let current;

    	function editable_1_editing_binding(value) {
    		/*editable_1_editing_binding*/ ctx[11].call(null, value);
    	}

    	function editable_1_item_binding(value) {
    		/*editable_1_item_binding*/ ctx[12].call(null, value);
    	}

    	let editable_1_props = {
    		class: /*editableClasses*/ ctx[5],
    		column: /*column*/ ctx[18]
    	};

    	if (/*editing*/ ctx[1] !== void 0) {
    		editable_1_props.editing = /*editing*/ ctx[1];
    	}

    	if (/*item*/ ctx[0] !== void 0) {
    		editable_1_props.item = /*item*/ ctx[0];
    	}

    	editable_1 = new Editable({ props: editable_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(editable_1, "editing", editable_1_editing_binding));
    	binding_callbacks.push(() => bind(editable_1, "item", editable_1_item_binding));
    	editable_1.$on("update", /*update_handler*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(editable_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editable_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editable_1_changes = {};
    			if (dirty & /*editableClasses*/ 32) editable_1_changes.class = /*editableClasses*/ ctx[5];
    			if (dirty & /*columns*/ 4) editable_1_changes.column = /*column*/ ctx[18];

    			if (!updating_editing && dirty & /*editing*/ 2) {
    				updating_editing = true;
    				editable_1_changes.editing = /*editing*/ ctx[1];
    				add_flush_callback(() => updating_editing = false);
    			}

    			if (!updating_item && dirty & /*item*/ 1) {
    				updating_item = true;
    				editable_1_changes.item = /*item*/ ctx[0];
    				add_flush_callback(() => updating_item = false);
    			}

    			editable_1.$set(editable_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editable_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editable_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editable_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$8.name,
    		type: "fallback",
    		source: "(60:33)            ",
    		ctx
    	});

    	return block;
    }

    // (72:6) {:else}
    function create_else_block$3(ctx) {
    	let html_tag;
    	let raw_value = /*item*/ ctx[0][/*column*/ ctx[18].field] + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item, columns*/ 5 && raw_value !== (raw_value = /*item*/ ctx[0][/*column*/ ctx[18].field] + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(72:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (70:6) {#if column.value}
    function create_if_block$8(ctx) {
    	let html_tag;
    	let raw_value = /*column*/ ctx[18].value(/*item*/ ctx[0]) + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*columns, item*/ 5 && raw_value !== (raw_value = /*column*/ ctx[18].value(/*item*/ ctx[0]) + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(70:6) {#if column.value}",
    		ctx
    	});

    	return block;
    }

    // (54:2) {#each columns as column, i}
    function create_each_block$1(ctx) {
    	let td;
    	let t0;
    	let t1;
    	let td_class_value;
    	let current;
    	let if_block0 = /*editable*/ ctx[3] && /*column*/ ctx[18].editable !== false && /*editing*/ ctx[1][/*index*/ ctx[4]] === /*i*/ ctx[20] && create_if_block_1$5(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*column*/ ctx[18].value) return create_if_block$8;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			attr_dev(td, "class", td_class_value = /*columnClass*/ ctx[7](/*column*/ ctx[18]));
    			toggle_class(td, "cursor-pointer", /*editable*/ ctx[3] && /*column*/ ctx[18].editable !== false);
    			add_location(td, file$h, 54, 4, 1355);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			if (if_block0) if_block0.m(td, null);
    			append_dev(td, t0);
    			if_block1.m(td, null);
    			append_dev(td, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*editable*/ ctx[3] && /*column*/ ctx[18].editable !== false && /*editing*/ ctx[1][/*index*/ ctx[4]] === /*i*/ ctx[20]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*editable, columns, editing, index*/ 30) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(td, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(td, t1);
    				}
    			}

    			if (!current || dirty & /*columns*/ 4 && td_class_value !== (td_class_value = /*columnClass*/ ctx[7](/*column*/ ctx[18]))) {
    				attr_dev(td, "class", td_class_value);
    			}

    			if (dirty & /*columns, editable, columns*/ 12) {
    				toggle_class(td, "cursor-pointer", /*editable*/ ctx[3] && /*column*/ ctx[18].editable !== false);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(54:2) {#each columns as column, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let tr;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*columns*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(tr, "class", /*c*/ ctx[6]);
    			toggle_class(tr, "selected", /*editing*/ ctx[1][/*index*/ ctx[4]]);
    			add_location(tr, file$h, 45, 0, 1133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", /*click_handler*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*columnClass, columns, editable, item, editableClasses, editing, $$scope, index*/ 703) {
    				each_value = /*columns*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*c*/ 64) {
    				attr_dev(tr, "class", /*c*/ ctx[6]);
    			}

    			if (dirty & /*c, editing, index*/ 82) {
    				toggle_class(tr, "selected", /*editing*/ ctx[1][/*index*/ ctx[4]]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$9 = "hover:bg-gray-50 dark-hover:bg-dark-400 border-gray-200 dark:border-gray-400 border-t border-b px-3";

    function instance$h($$self, $$props, $$invalidate) {
    	let { classes = classesDefault$9 } = $$props;
    	let { item = {} } = $$props;
    	let { columns = [] } = $$props;
    	let { editing = false } = $$props;
    	let { editable = false } = $$props;
    	let { index = 0 } = $$props;
    	let { editableClasses = i => i } = $$props;
    	const dispatch = createEventDispatcher();
    	const cb = new ClassBuilder(classes, classesDefault$9);

    	function columnClass(column) {
    		const cb = new ClassBuilder("relative p-3 font-normal text-right");

    		if (column.replace) {
    			cb.replace(column.replace);
    		}

    		if (column.add || column.class) {
    			cb.add(column.add || column.class);
    		}

    		if (column.remove) {
    			cb.remove(column.remove);
    		}

    		return cb.get();
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Row", $$slots, ['edit-dialog']);

    	function editable_1_editing_binding(value) {
    		editing = value;
    		$$invalidate(1, editing);
    	}

    	function editable_1_item_binding(value) {
    		item = value;
    		$$invalidate(0, item);
    	}

    	function update_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler = e => {
    		if (!editable) return;

    		$$invalidate(1, editing = {
    			[index]: (e.path.find(a => a.localName === "td") || {}).cellIndex
    		});
    	};

    	$$self.$set = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("classes" in $$new_props) $$invalidate(8, classes = $$new_props.classes);
    		if ("item" in $$new_props) $$invalidate(0, item = $$new_props.item);
    		if ("columns" in $$new_props) $$invalidate(2, columns = $$new_props.columns);
    		if ("editing" in $$new_props) $$invalidate(1, editing = $$new_props.editing);
    		if ("editable" in $$new_props) $$invalidate(3, editable = $$new_props.editable);
    		if ("index" in $$new_props) $$invalidate(4, index = $$new_props.index);
    		if ("editableClasses" in $$new_props) $$invalidate(5, editableClasses = $$new_props.editableClasses);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		createEventDispatcher,
    		Editable,
    		Spacer: Spacer$1,
    		Icon,
    		classesDefault: classesDefault$9,
    		classes,
    		item,
    		columns,
    		editing,
    		editable,
    		index,
    		editableClasses,
    		dispatch,
    		cb,
    		columnClass,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), $$new_props));
    		if ("classes" in $$props) $$invalidate(8, classes = $$new_props.classes);
    		if ("item" in $$props) $$invalidate(0, item = $$new_props.item);
    		if ("columns" in $$props) $$invalidate(2, columns = $$new_props.columns);
    		if ("editing" in $$props) $$invalidate(1, editing = $$new_props.editing);
    		if ("editable" in $$props) $$invalidate(3, editable = $$new_props.editable);
    		if ("index" in $$props) $$invalidate(4, index = $$new_props.index);
    		if ("editableClasses" in $$props) $$invalidate(5, editableClasses = $$new_props.editableClasses);
    		if ("c" in $$props) $$invalidate(6, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(6, c = cb.flush().add(classes, true, classesDefault$9).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		item,
    		editing,
    		columns,
    		editable,
    		index,
    		editableClasses,
    		c,
    		columnClass,
    		classes,
    		$$scope,
    		$$slots,
    		editable_1_editing_binding,
    		editable_1_item_binding,
    		update_handler,
    		click_handler
    	];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			classes: 8,
    			item: 0,
    			columns: 2,
    			editing: 1,
    			editable: 3,
    			index: 4,
    			editableClasses: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get classes() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columns() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columns(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editing() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editing(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editable() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editable(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editableClasses() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editableClasses(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\DataTable\Pagination.svelte generated by Svelte v3.24.0 */
    const file$i = "node_modules\\smelte\\src\\components\\DataTable\\Pagination.svelte";

    function create_fragment$i(ctx) {
    	let tfoot;
    	let tr;
    	let td;
    	let div2;
    	let spacer0;
    	let t0;
    	let div0;
    	let t2;
    	let select;
    	let updating_value;
    	let t3;
    	let spacer1;
    	let t4;
    	let div1;
    	let t5;
    	let t6;

    	let t7_value = (/*offset*/ ctx[2] + /*perPage*/ ctx[0] > /*total*/ ctx[7]
    	? /*total*/ ctx[7]
    	: /*offset*/ ctx[2] + /*perPage*/ ctx[0]) + "";

    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let button0;
    	let t11;
    	let button1;
    	let current;
    	spacer0 = new Spacer$1({ $$inline: true });

    	function select_value_binding(value) {
    		/*select_value_binding*/ ctx[12].call(null, value);
    	}

    	let select_props = {
    		class: "w-16 h-8 mb-5",
    		remove: "select",
    		replace: { "pt-6": "pt-4" },
    		inputWrapperClasses: func,
    		appendClasses: func_1,
    		noUnderline: true,
    		dense: true,
    		items: /*perPageOptions*/ ctx[4]
    	};

    	if (/*perPage*/ ctx[0] !== void 0) {
    		select_props.value = /*perPage*/ ctx[0];
    	}

    	select = new Select({ props: select_props, $$inline: true });
    	binding_callbacks.push(() => bind(select, "value", select_value_binding));
    	spacer1 = new Spacer$1({ $$inline: true });

    	const button0_spread_levels = [
    		{ disabled: /*page*/ ctx[1] - 1 < 1 },
    		{ icon: "keyboard_arrow_left" },
    		/*paginatorProps*/ ctx[8] || /*paginatorPropsDefault*/ ctx[10]
    	];

    	let button0_props = {};

    	for (let i = 0; i < button0_spread_levels.length; i += 1) {
    		button0_props = assign(button0_props, button0_spread_levels[i]);
    	}

    	button0 = new Button({ props: button0_props, $$inline: true });
    	button0.$on("click", /*click_handler*/ ctx[13]);

    	const button1_spread_levels = [
    		{
    			disabled: /*page*/ ctx[1] === /*pagesCount*/ ctx[3]
    		},
    		{ icon: "keyboard_arrow_right" },
    		/*paginatorProps*/ ctx[8] || /*paginatorPropsDefault*/ ctx[10]
    	];

    	let button1_props = {};

    	for (let i = 0; i < button1_spread_levels.length; i += 1) {
    		button1_props = assign(button1_props, button1_spread_levels[i]);
    	}

    	button1 = new Button({ props: button1_props, $$inline: true });
    	button1.$on("click", /*click_handler_1*/ ctx[14]);

    	const block = {
    		c: function create() {
    			tfoot = element("tfoot");
    			tr = element("tr");
    			td = element("td");
    			div2 = element("div");
    			create_component(spacer0.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "Rows per page:";
    			t2 = space();
    			create_component(select.$$.fragment);
    			t3 = space();
    			create_component(spacer1.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(/*offset*/ ctx[2]);
    			t6 = text("-");
    			t7 = text(t7_value);
    			t8 = text(" of ");
    			t9 = text(/*total*/ ctx[7]);
    			t10 = space();
    			create_component(button0.$$.fragment);
    			t11 = space();
    			create_component(button1.$$.fragment);
    			attr_dev(div0, "class", "mr-1 py-1");
    			add_location(div0, file$i, 53, 8, 1310);
    			add_location(div1, file$i, 68, 8, 1789);
    			attr_dev(div2, "class", /*c*/ ctx[9]);
    			add_location(div2, file$i, 51, 6, 1267);
    			attr_dev(td, "colspan", "100%");
    			attr_dev(td, "class", "border-none");
    			add_location(td, file$i, 50, 4, 1221);
    			add_location(tr, file$i, 49, 2, 1212);
    			add_location(tfoot, file$i, 48, 0, 1202);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tfoot, anchor);
    			append_dev(tfoot, tr);
    			append_dev(tr, td);
    			append_dev(td, div2);
    			mount_component(spacer0, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			mount_component(select, div2, null);
    			append_dev(div2, t3);
    			mount_component(spacer1, div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			append_dev(div1, t6);
    			append_dev(div1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, t9);
    			append_dev(div2, t10);
    			mount_component(button0, div2, null);
    			append_dev(div2, t11);
    			mount_component(button1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const select_changes = {};
    			if (dirty & /*perPageOptions*/ 16) select_changes.items = /*perPageOptions*/ ctx[4];

    			if (!updating_value && dirty & /*perPage*/ 1) {
    				updating_value = true;
    				select_changes.value = /*perPage*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			select.$set(select_changes);
    			if (!current || dirty & /*offset*/ 4) set_data_dev(t5, /*offset*/ ctx[2]);

    			if ((!current || dirty & /*offset, perPage, total*/ 133) && t7_value !== (t7_value = (/*offset*/ ctx[2] + /*perPage*/ ctx[0] > /*total*/ ctx[7]
    			? /*total*/ ctx[7]
    			: /*offset*/ ctx[2] + /*perPage*/ ctx[0]) + "")) set_data_dev(t7, t7_value);

    			if (!current || dirty & /*total*/ 128) set_data_dev(t9, /*total*/ ctx[7]);

    			const button0_changes = (dirty & /*page, paginatorProps, paginatorPropsDefault*/ 1282)
    			? get_spread_update(button0_spread_levels, [
    					dirty & /*page*/ 2 && { disabled: /*page*/ ctx[1] - 1 < 1 },
    					button0_spread_levels[1],
    					dirty & /*paginatorProps, paginatorPropsDefault*/ 1280 && get_spread_object(/*paginatorProps*/ ctx[8] || /*paginatorPropsDefault*/ ctx[10])
    				])
    			: {};

    			button0.$set(button0_changes);

    			const button1_changes = (dirty & /*page, pagesCount, paginatorProps, paginatorPropsDefault*/ 1290)
    			? get_spread_update(button1_spread_levels, [
    					dirty & /*page, pagesCount*/ 10 && {
    						disabled: /*page*/ ctx[1] === /*pagesCount*/ ctx[3]
    					},
    					button1_spread_levels[1],
    					dirty & /*paginatorProps, paginatorPropsDefault*/ 1280 && get_spread_object(/*paginatorProps*/ ctx[8] || /*paginatorPropsDefault*/ ctx[10])
    				])
    			: {};

    			button1.$set(button1_changes);

    			if (!current || dirty & /*c*/ 512) {
    				attr_dev(div2, "class", /*c*/ ctx[9]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spacer0.$$.fragment, local);
    			transition_in(select.$$.fragment, local);
    			transition_in(spacer1.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spacer0.$$.fragment, local);
    			transition_out(select.$$.fragment, local);
    			transition_out(spacer1.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tfoot);
    			destroy_component(spacer0);
    			destroy_component(select);
    			destroy_component(spacer1);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$a = "flex justify-between items-center text-gray-700 text-sm w-full h-16";
    const func = c => c.replace("mt-2", "").replace("pb-6", "");
    const func_1 = c => c.replace("pt-4", "pt-3").replace("pr-4", "pr-2");

    function instance$i($$self, $$props, $$invalidate) {
    	const paginatorPropsDefault = {
    		color: "gray",
    		text: true,
    		flat: true,
    		dark: true,
    		remove: "px-4 px-3",
    		iconClasses: c => c.replace("p-4", ""),
    		disabledClasses: c => c.replace("text-white", "text-gray-200").replace("bg-gray-300", "bg-transparent").replace("text-gray-700", "")
    	};

    	let { classes = classesDefault$a } = $$props;
    	let { perPage = 0 } = $$props;
    	let { page = 0 } = $$props;
    	let { offset = 0 } = $$props;
    	let { pagesCount = 0 } = $$props;
    	let { perPageOptions = 0 } = $$props;
    	let { scrollToTop = false } = $$props;
    	let { table = null } = $$props;
    	let { total = 0 } = $$props;
    	let { paginatorProps = false } = $$props;
    	const dispatch = createEventDispatcher();
    	const cb = new ClassBuilder(classes, classesDefault$a);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pagination", $$slots, []);

    	function select_value_binding(value) {
    		perPage = value;
    		$$invalidate(0, perPage);
    	}

    	const click_handler = () => {
    		$$invalidate(1, page -= 1);
    		if (scrollToTop) table.scrollIntoView({ behavior: "smooth" });
    	};

    	const click_handler_1 = () => {
    		$$invalidate(1, page += 1);
    		if (scrollToTop) table.scrollIntoView({ behavior: "smooth" });
    	};

    	$$self.$set = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("classes" in $$new_props) $$invalidate(11, classes = $$new_props.classes);
    		if ("perPage" in $$new_props) $$invalidate(0, perPage = $$new_props.perPage);
    		if ("page" in $$new_props) $$invalidate(1, page = $$new_props.page);
    		if ("offset" in $$new_props) $$invalidate(2, offset = $$new_props.offset);
    		if ("pagesCount" in $$new_props) $$invalidate(3, pagesCount = $$new_props.pagesCount);
    		if ("perPageOptions" in $$new_props) $$invalidate(4, perPageOptions = $$new_props.perPageOptions);
    		if ("scrollToTop" in $$new_props) $$invalidate(5, scrollToTop = $$new_props.scrollToTop);
    		if ("table" in $$new_props) $$invalidate(6, table = $$new_props.table);
    		if ("total" in $$new_props) $$invalidate(7, total = $$new_props.total);
    		if ("paginatorProps" in $$new_props) $$invalidate(8, paginatorProps = $$new_props.paginatorProps);
    	};

    	$$self.$capture_state = () => ({
    		ClassBuilder,
    		createEventDispatcher,
    		Select,
    		Button,
    		Spacer: Spacer$1,
    		Icon,
    		classesDefault: classesDefault$a,
    		paginatorPropsDefault,
    		classes,
    		perPage,
    		page,
    		offset,
    		pagesCount,
    		perPageOptions,
    		scrollToTop,
    		table,
    		total,
    		paginatorProps,
    		dispatch,
    		cb,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), $$new_props));
    		if ("classes" in $$props) $$invalidate(11, classes = $$new_props.classes);
    		if ("perPage" in $$props) $$invalidate(0, perPage = $$new_props.perPage);
    		if ("page" in $$props) $$invalidate(1, page = $$new_props.page);
    		if ("offset" in $$props) $$invalidate(2, offset = $$new_props.offset);
    		if ("pagesCount" in $$props) $$invalidate(3, pagesCount = $$new_props.pagesCount);
    		if ("perPageOptions" in $$props) $$invalidate(4, perPageOptions = $$new_props.perPageOptions);
    		if ("scrollToTop" in $$props) $$invalidate(5, scrollToTop = $$new_props.scrollToTop);
    		if ("table" in $$props) $$invalidate(6, table = $$new_props.table);
    		if ("total" in $$props) $$invalidate(7, total = $$new_props.total);
    		if ("paginatorProps" in $$props) $$invalidate(8, paginatorProps = $$new_props.paginatorProps);
    		if ("c" in $$props) $$invalidate(9, c = $$new_props.c);
    	};

    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(9, c = cb.flush().add(classes, true, classesDefault$a).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		perPage,
    		page,
    		offset,
    		pagesCount,
    		perPageOptions,
    		scrollToTop,
    		table,
    		total,
    		paginatorProps,
    		c,
    		paginatorPropsDefault,
    		classes,
    		select_value_binding,
    		click_handler,
    		click_handler_1
    	];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			classes: 11,
    			perPage: 0,
    			page: 1,
    			offset: 2,
    			pagesCount: 3,
    			perPageOptions: 4,
    			scrollToTop: 5,
    			table: 6,
    			total: 7,
    			paginatorProps: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get classes() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get perPage() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set perPage(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get page() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pagesCount() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pagesCount(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get perPageOptions() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set perPageOptions(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollToTop() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollToTop(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get table() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set table(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get total() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set total(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paginatorProps() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paginatorProps(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function sort(data, col, asc) {
      if (!col) return data;

      if (col.sort) return col.sort(data);

      const sorted = data.sort((a, b) => {
        const valA = col.value ? col.value(a) : a[col.field];
        const valB = col.value ? col.value(b) : b[col.field];

        const first = asc ? valA : valB;
        const second = asc ? valB : valA;

        if (typeof valA === "number") {
          return first - second;
        }

        return ("" + first).localeCompare(second);
      });

      return sorted;
    }

    /* node_modules\smelte\src\components\DataTable\DataTable.svelte generated by Svelte v3.24.0 */
    const file$j = "node_modules\\smelte\\src\\components\\DataTable\\DataTable.svelte";
    const get_footer_slot_changes = dirty => ({});
    const get_footer_slot_context = ctx => ({});
    const get_pagination_slot_changes = dirty => ({});
    const get_pagination_slot_context = ctx => ({});
    const get_item_slot_changes$1 = dirty => ({});
    const get_item_slot_context$1 = ctx => ({});

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[42] = i;
    	return child_ctx;
    }

    // (67:26)          
    function fallback_block_2$1(ctx) {
    	let header;
    	let updating_asc;
    	let updating_sortBy;
    	let t;
    	let current;

    	function header_asc_binding(value) {
    		/*header_asc_binding*/ ctx[27].call(null, value);
    	}

    	function header_sortBy_binding(value) {
    		/*header_sortBy_binding*/ ctx[28].call(null, value);
    	}

    	let header_props = {
    		class: /*headerClasses*/ ctx[12],
    		column: /*column*/ ctx[40],
    		sortable: /*sortable*/ ctx[9],
    		editing: /*editing*/ ctx[18]
    	};

    	if (/*asc*/ ctx[2] !== void 0) {
    		header_props.asc = /*asc*/ ctx[2];
    	}

    	if (/*sortBy*/ ctx[17] !== void 0) {
    		header_props.sortBy = /*sortBy*/ ctx[17];
    	}

    	header = new Header({ props: header_props, $$inline: true });
    	binding_callbacks.push(() => bind(header, "asc", header_asc_binding));
    	binding_callbacks.push(() => bind(header, "sortBy", header_sortBy_binding));

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const header_changes = {};
    			if (dirty[0] & /*headerClasses*/ 4096) header_changes.class = /*headerClasses*/ ctx[12];
    			if (dirty[0] & /*columns*/ 16) header_changes.column = /*column*/ ctx[40];
    			if (dirty[0] & /*sortable*/ 512) header_changes.sortable = /*sortable*/ ctx[9];
    			if (dirty[0] & /*editing*/ 262144) header_changes.editing = /*editing*/ ctx[18];

    			if (!updating_asc && dirty[0] & /*asc*/ 4) {
    				updating_asc = true;
    				header_changes.asc = /*asc*/ ctx[2];
    				add_flush_callback(() => updating_asc = false);
    			}

    			if (!updating_sortBy && dirty[0] & /*sortBy*/ 131072) {
    				updating_sortBy = true;
    				header_changes.sortBy = /*sortBy*/ ctx[17];
    				add_flush_callback(() => updating_sortBy = false);
    			}

    			header.$set(header_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2$1.name,
    		type: "fallback",
    		source: "(67:26)          ",
    		ctx
    	});

    	return block;
    }

    // (66:4) {#each columns as column, i}
    function create_each_block_1(ctx) {
    	let current;
    	const header_slot_template = /*$$slots*/ ctx[26].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[25], get_header_slot_context);
    	const header_slot_or_fallback = header_slot || fallback_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (header_slot_or_fallback) header_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (header_slot_or_fallback) {
    				header_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (header_slot) {
    				if (header_slot.p && dirty[0] & /*$$scope*/ 33554432) {
    					update_slot(header_slot, header_slot_template, ctx, /*$$scope*/ ctx[25], dirty, get_header_slot_changes, get_header_slot_context);
    				}
    			} else {
    				if (header_slot_or_fallback && header_slot_or_fallback.p && dirty[0] & /*headerClasses, columns, sortable, editing, asc, sortBy*/ 397844) {
    					header_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (header_slot_or_fallback) header_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(66:4) {#each columns as column, i}",
    		ctx
    	});

    	return block;
    }

    // (79:2) {#if loading && !hideProgress}
    function create_if_block_1$6(ctx) {
    	let div;
    	let progresslinear;
    	let div_transition;
    	let current;
    	progresslinear = new ProgressLinear({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(progresslinear.$$.fragment);
    			attr_dev(div, "class", "absolute w-full");
    			add_location(div, file$j, 79, 4, 2127);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(progresslinear, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progresslinear.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progresslinear.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(progresslinear);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(79:2) {#if loading && !hideProgress}",
    		ctx
    	});

    	return block;
    }

    // (86:24)          
    function fallback_block_1$3(ctx) {
    	let row;
    	let updating_editing;
    	let t;
    	let current;

    	function row_editing_binding(value) {
    		/*row_editing_binding*/ ctx[29].call(null, value);
    	}

    	let row_props = {
    		index: /*index*/ ctx[39],
    		item: /*item*/ ctx[37],
    		columns: /*columns*/ ctx[4],
    		editable: /*editable*/ ctx[8],
    		editableClasses: /*editableClasses*/ ctx[14]
    	};

    	if (/*editing*/ ctx[18] !== void 0) {
    		row_props.editing = /*editing*/ ctx[18];
    	}

    	row = new Row({ props: row_props, $$inline: true });
    	binding_callbacks.push(() => bind(row, "editing", row_editing_binding));
    	row.$on("update", /*update_handler*/ ctx[30]);

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};
    			if (dirty[0] & /*sorted*/ 1048576) row_changes.item = /*item*/ ctx[37];
    			if (dirty[0] & /*columns*/ 16) row_changes.columns = /*columns*/ ctx[4];
    			if (dirty[0] & /*editable*/ 256) row_changes.editable = /*editable*/ ctx[8];
    			if (dirty[0] & /*editableClasses*/ 16384) row_changes.editableClasses = /*editableClasses*/ ctx[14];

    			if (!updating_editing && dirty[0] & /*editing*/ 262144) {
    				updating_editing = true;
    				row_changes.editing = /*editing*/ ctx[18];
    				add_flush_callback(() => updating_editing = false);
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1$3.name,
    		type: "fallback",
    		source: "(86:24)          ",
    		ctx
    	});

    	return block;
    }

    // (85:4) {#each sorted as item, index}
    function create_each_block$2(ctx) {
    	let current;
    	const item_slot_template = /*$$slots*/ ctx[26].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[25], get_item_slot_context$1);
    	const item_slot_or_fallback = item_slot || fallback_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			if (item_slot_or_fallback) item_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (item_slot_or_fallback) {
    				item_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (item_slot) {
    				if (item_slot.p && dirty[0] & /*$$scope*/ 33554432) {
    					update_slot(item_slot, item_slot_template, ctx, /*$$scope*/ ctx[25], dirty, get_item_slot_changes$1, get_item_slot_context$1);
    				}
    			} else {
    				if (item_slot_or_fallback && item_slot_or_fallback.p && dirty[0] & /*sorted, columns, editable, editableClasses, editing*/ 1327376) {
    					item_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (item_slot_or_fallback) item_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(85:4) {#each sorted as item, index}",
    		ctx
    	});

    	return block;
    }

    // (99:2) {#if pagination}
    function create_if_block$9(ctx) {
    	let current;
    	const pagination_slot_template = /*$$slots*/ ctx[26].pagination;
    	const pagination_slot = create_slot(pagination_slot_template, ctx, /*$$scope*/ ctx[25], get_pagination_slot_context);
    	const pagination_slot_or_fallback = pagination_slot || fallback_block$9(ctx);

    	const block = {
    		c: function create() {
    			if (pagination_slot_or_fallback) pagination_slot_or_fallback.c();
    		},
    		m: function mount(target, anchor) {
    			if (pagination_slot_or_fallback) {
    				pagination_slot_or_fallback.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (pagination_slot) {
    				if (pagination_slot.p && dirty[0] & /*$$scope*/ 33554432) {
    					update_slot(pagination_slot, pagination_slot_template, ctx, /*$$scope*/ ctx[25], dirty, get_pagination_slot_changes, get_pagination_slot_context);
    				}
    			} else {
    				if (pagination_slot_or_fallback && pagination_slot_or_fallback.p && dirty[0] & /*paginationClasses, perPageOptions, scrollToTop, paginatorProps, offset, pagesCount, table, data, page, perPage*/ 2730027) {
    					pagination_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (pagination_slot_or_fallback) pagination_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(99:2) {#if pagination}",
    		ctx
    	});

    	return block;
    }

    // (100:28)        
    function fallback_block$9(ctx) {
    	let pagination_1;
    	let updating_page;
    	let updating_perPage;
    	let current;

    	function pagination_1_page_binding(value) {
    		/*pagination_1_page_binding*/ ctx[31].call(null, value);
    	}

    	function pagination_1_perPage_binding(value) {
    		/*pagination_1_perPage_binding*/ ctx[32].call(null, value);
    	}

    	let pagination_1_props = {
    		class: /*paginationClasses*/ ctx[13],
    		perPageOptions: /*perPageOptions*/ ctx[5],
    		scrollToTop: /*scrollToTop*/ ctx[11],
    		paginatorProps: /*paginatorProps*/ ctx[15],
    		offset: /*offset*/ ctx[19],
    		pagesCount: /*pagesCount*/ ctx[21],
    		table: /*table*/ ctx[16],
    		total: /*data*/ ctx[3].length
    	};

    	if (/*page*/ ctx[0] !== void 0) {
    		pagination_1_props.page = /*page*/ ctx[0];
    	}

    	if (/*perPage*/ ctx[1] !== void 0) {
    		pagination_1_props.perPage = /*perPage*/ ctx[1];
    	}

    	pagination_1 = new Pagination({
    			props: pagination_1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(pagination_1, "page", pagination_1_page_binding));
    	binding_callbacks.push(() => bind(pagination_1, "perPage", pagination_1_perPage_binding));

    	const block = {
    		c: function create() {
    			create_component(pagination_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pagination_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pagination_1_changes = {};
    			if (dirty[0] & /*paginationClasses*/ 8192) pagination_1_changes.class = /*paginationClasses*/ ctx[13];
    			if (dirty[0] & /*perPageOptions*/ 32) pagination_1_changes.perPageOptions = /*perPageOptions*/ ctx[5];
    			if (dirty[0] & /*scrollToTop*/ 2048) pagination_1_changes.scrollToTop = /*scrollToTop*/ ctx[11];
    			if (dirty[0] & /*paginatorProps*/ 32768) pagination_1_changes.paginatorProps = /*paginatorProps*/ ctx[15];
    			if (dirty[0] & /*offset*/ 524288) pagination_1_changes.offset = /*offset*/ ctx[19];
    			if (dirty[0] & /*pagesCount*/ 2097152) pagination_1_changes.pagesCount = /*pagesCount*/ ctx[21];
    			if (dirty[0] & /*table*/ 65536) pagination_1_changes.table = /*table*/ ctx[16];
    			if (dirty[0] & /*data*/ 8) pagination_1_changes.total = /*data*/ ctx[3].length;

    			if (!updating_page && dirty[0] & /*page*/ 1) {
    				updating_page = true;
    				pagination_1_changes.page = /*page*/ ctx[0];
    				add_flush_callback(() => updating_page = false);
    			}

    			if (!updating_perPage && dirty[0] & /*perPage*/ 2) {
    				updating_perPage = true;
    				pagination_1_changes.perPage = /*perPage*/ ctx[1];
    				add_flush_callback(() => updating_perPage = false);
    			}

    			pagination_1.$set(pagination_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pagination_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block$9.name,
    		type: "fallback",
    		source: "(100:28)        ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let table_1;
    	let thead;
    	let t0;
    	let t1;
    	let tbody;
    	let t2;
    	let t3;
    	let current;
    	let each_value_1 = /*columns*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let if_block0 = /*loading*/ ctx[6] && !/*hideProgress*/ ctx[7] && create_if_block_1$6(ctx);
    	let each_value = /*sorted*/ ctx[20];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block1 = /*pagination*/ ctx[10] && create_if_block$9(ctx);
    	const footer_slot_template = /*$$slots*/ ctx[26].footer;
    	const footer_slot = create_slot(footer_slot_template, ctx, /*$$scope*/ ctx[25], get_footer_slot_context);

    	const block = {
    		c: function create() {
    			table_1 = element("table");
    			thead = element("thead");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (footer_slot) footer_slot.c();
    			attr_dev(thead, "class", "items-center");
    			add_location(thead, file$j, 64, 2, 1804);
    			add_location(tbody, file$j, 83, 2, 2220);
    			attr_dev(table_1, "class", /*c*/ ctx[22]);
    			add_location(table_1, file$j, 63, 0, 1766);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table_1, anchor);
    			append_dev(table_1, thead);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(thead, null);
    			}

    			append_dev(table_1, t0);
    			if (if_block0) if_block0.m(table_1, null);
    			append_dev(table_1, t1);
    			append_dev(table_1, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(table_1, t2);
    			if (if_block1) if_block1.m(table_1, null);
    			append_dev(table_1, t3);

    			if (footer_slot) {
    				footer_slot.m(table_1, null);
    			}

    			/*table_1_binding*/ ctx[33](table_1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*headerClasses, columns, sortable, editing, asc, sortBy, $$scope*/ 33952276) {
    				each_value_1 = /*columns*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(thead, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*loading*/ ctx[6] && !/*hideProgress*/ ctx[7]) {
    				if (if_block0) {
    					if (dirty[0] & /*loading, hideProgress*/ 192) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(table_1, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*sorted, columns, editable, editableClasses, editing, $$scope*/ 34881808) {
    				each_value = /*sorted*/ ctx[20];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (/*pagination*/ ctx[10]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*pagination*/ 1024) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$9(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(table_1, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (footer_slot) {
    				if (footer_slot.p && dirty[0] & /*$$scope*/ 33554432) {
    					update_slot(footer_slot, footer_slot_template, ctx, /*$$scope*/ ctx[25], dirty, get_footer_slot_changes, get_footer_slot_context);
    				}
    			}

    			if (!current || dirty[0] & /*c*/ 4194304) {
    				attr_dev(table_1, "class", /*c*/ ctx[22]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(if_block0);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block1);
    			transition_in(footer_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(if_block0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block1);
    			transition_out(footer_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table_1);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			if (footer_slot) footer_slot.d(detaching);
    			/*table_1_binding*/ ctx[33](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$b = "elevation-3 relative text-sm overflow-x-auto dark:bg-dark-500";

    function instance$j($$self, $$props, $$invalidate) {
    	let { data = [] } = $$props;

    	let { columns = Object.keys(data[0] || {}).map(i => ({
    		label: (i || "").replace("_", " "),
    		field: i
    	})) } = $$props;

    	let { page = 1 } = $$props;
    	let { sort: sort$1 = sort } = $$props;
    	let { perPage = 10 } = $$props;
    	let { perPageOptions = [10, 20, 50] } = $$props;
    	let { asc = false } = $$props;
    	let { loading = false } = $$props;
    	let { hideProgress = false } = $$props;
    	let { editable = true } = $$props;
    	let { sortable = true } = $$props;
    	let { pagination = true } = $$props;
    	let { scrollToTop = false } = $$props;
    	let { headerClasses = i => i } = $$props;
    	let { paginationClasses = i => i } = $$props;
    	let { editableClasses = i => i } = $$props;
    	let { paginatorProps = null } = $$props;
    	let { classes = classesDefault$b } = $$props;
    	let table = "";
    	let sortBy = null;
    	const dispatch = createEventDispatcher();
    	let editing = false;
    	const cb = new ClassBuilder(classes, classesDefault$b);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DataTable", $$slots, ['header','item','pagination','footer']);

    	function header_asc_binding(value) {
    		asc = value;
    		$$invalidate(2, asc);
    	}

    	function header_sortBy_binding(value) {
    		sortBy = value;
    		$$invalidate(17, sortBy);
    	}

    	function row_editing_binding(value) {
    		editing = value;
    		$$invalidate(18, editing);
    	}

    	function update_handler(event) {
    		bubble($$self, event);
    	}

    	function pagination_1_page_binding(value) {
    		page = value;
    		$$invalidate(0, page);
    	}

    	function pagination_1_perPage_binding(value) {
    		perPage = value;
    		(($$invalidate(1, perPage), $$invalidate(10, pagination)), $$invalidate(3, data));
    	}

    	function table_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			table = $$value;
    			$$invalidate(16, table);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(36, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("data" in $$new_props) $$invalidate(3, data = $$new_props.data);
    		if ("columns" in $$new_props) $$invalidate(4, columns = $$new_props.columns);
    		if ("page" in $$new_props) $$invalidate(0, page = $$new_props.page);
    		if ("sort" in $$new_props) $$invalidate(23, sort$1 = $$new_props.sort);
    		if ("perPage" in $$new_props) $$invalidate(1, perPage = $$new_props.perPage);
    		if ("perPageOptions" in $$new_props) $$invalidate(5, perPageOptions = $$new_props.perPageOptions);
    		if ("asc" in $$new_props) $$invalidate(2, asc = $$new_props.asc);
    		if ("loading" in $$new_props) $$invalidate(6, loading = $$new_props.loading);
    		if ("hideProgress" in $$new_props) $$invalidate(7, hideProgress = $$new_props.hideProgress);
    		if ("editable" in $$new_props) $$invalidate(8, editable = $$new_props.editable);
    		if ("sortable" in $$new_props) $$invalidate(9, sortable = $$new_props.sortable);
    		if ("pagination" in $$new_props) $$invalidate(10, pagination = $$new_props.pagination);
    		if ("scrollToTop" in $$new_props) $$invalidate(11, scrollToTop = $$new_props.scrollToTop);
    		if ("headerClasses" in $$new_props) $$invalidate(12, headerClasses = $$new_props.headerClasses);
    		if ("paginationClasses" in $$new_props) $$invalidate(13, paginationClasses = $$new_props.paginationClasses);
    		if ("editableClasses" in $$new_props) $$invalidate(14, editableClasses = $$new_props.editableClasses);
    		if ("paginatorProps" in $$new_props) $$invalidate(15, paginatorProps = $$new_props.paginatorProps);
    		if ("classes" in $$new_props) $$invalidate(24, classes = $$new_props.classes);
    		if ("$$scope" in $$new_props) $$invalidate(25, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		slide,
    		ClassBuilder,
    		Icon,
    		Button,
    		TextField,
    		ProgressLinear,
    		Header,
    		Row,
    		Pagination,
    		defaultSort: sort,
    		classesDefault: classesDefault$b,
    		data,
    		columns,
    		page,
    		sort: sort$1,
    		perPage,
    		perPageOptions,
    		asc,
    		loading,
    		hideProgress,
    		editable,
    		sortable,
    		pagination,
    		scrollToTop,
    		headerClasses,
    		paginationClasses,
    		editableClasses,
    		paginatorProps,
    		classes,
    		table,
    		sortBy,
    		dispatch,
    		editing,
    		cb,
    		offset,
    		sorted,
    		pagesCount,
    		c
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(36, $$props = assign(assign({}, $$props), $$new_props));
    		if ("data" in $$props) $$invalidate(3, data = $$new_props.data);
    		if ("columns" in $$props) $$invalidate(4, columns = $$new_props.columns);
    		if ("page" in $$props) $$invalidate(0, page = $$new_props.page);
    		if ("sort" in $$props) $$invalidate(23, sort$1 = $$new_props.sort);
    		if ("perPage" in $$props) $$invalidate(1, perPage = $$new_props.perPage);
    		if ("perPageOptions" in $$props) $$invalidate(5, perPageOptions = $$new_props.perPageOptions);
    		if ("asc" in $$props) $$invalidate(2, asc = $$new_props.asc);
    		if ("loading" in $$props) $$invalidate(6, loading = $$new_props.loading);
    		if ("hideProgress" in $$props) $$invalidate(7, hideProgress = $$new_props.hideProgress);
    		if ("editable" in $$props) $$invalidate(8, editable = $$new_props.editable);
    		if ("sortable" in $$props) $$invalidate(9, sortable = $$new_props.sortable);
    		if ("pagination" in $$props) $$invalidate(10, pagination = $$new_props.pagination);
    		if ("scrollToTop" in $$props) $$invalidate(11, scrollToTop = $$new_props.scrollToTop);
    		if ("headerClasses" in $$props) $$invalidate(12, headerClasses = $$new_props.headerClasses);
    		if ("paginationClasses" in $$props) $$invalidate(13, paginationClasses = $$new_props.paginationClasses);
    		if ("editableClasses" in $$props) $$invalidate(14, editableClasses = $$new_props.editableClasses);
    		if ("paginatorProps" in $$props) $$invalidate(15, paginatorProps = $$new_props.paginatorProps);
    		if ("classes" in $$props) $$invalidate(24, classes = $$new_props.classes);
    		if ("table" in $$props) $$invalidate(16, table = $$new_props.table);
    		if ("sortBy" in $$props) $$invalidate(17, sortBy = $$new_props.sortBy);
    		if ("editing" in $$props) $$invalidate(18, editing = $$new_props.editing);
    		if ("offset" in $$props) $$invalidate(19, offset = $$new_props.offset);
    		if ("sorted" in $$props) $$invalidate(20, sorted = $$new_props.sorted);
    		if ("pagesCount" in $$props) $$invalidate(21, pagesCount = $$new_props.pagesCount);
    		if ("c" in $$props) $$invalidate(22, c = $$new_props.c);
    	};

    	let offset;
    	let sorted;
    	let pagesCount;
    	let c;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*pagination, perPage, data*/ 1034) {
    			 {
    				$$invalidate(1, perPage = pagination ? perPage : data.length);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*page, perPage*/ 3) {
    			 $$invalidate(19, offset = page * perPage - perPage);
    		}

    		if ($$self.$$.dirty[0] & /*sort, data, sortBy, asc, offset, perPage*/ 9043982) {
    			 $$invalidate(20, sorted = sort$1(data, sortBy, asc).slice(offset, perPage + offset));
    		}

    		if ($$self.$$.dirty[0] & /*data, perPage*/ 10) {
    			 $$invalidate(21, pagesCount = Math.ceil(data.length / perPage));
    		}

    		 $$invalidate(22, c = cb.flush().add(classes, true, classesDefault$b).add($$props.class).get());
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		page,
    		perPage,
    		asc,
    		data,
    		columns,
    		perPageOptions,
    		loading,
    		hideProgress,
    		editable,
    		sortable,
    		pagination,
    		scrollToTop,
    		headerClasses,
    		paginationClasses,
    		editableClasses,
    		paginatorProps,
    		table,
    		sortBy,
    		editing,
    		offset,
    		sorted,
    		pagesCount,
    		c,
    		sort$1,
    		classes,
    		$$scope,
    		$$slots,
    		header_asc_binding,
    		header_sortBy_binding,
    		row_editing_binding,
    		update_handler,
    		pagination_1_page_binding,
    		pagination_1_perPage_binding,
    		table_1_binding
    	];
    }

    class DataTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$j,
    			create_fragment$j,
    			safe_not_equal,
    			{
    				data: 3,
    				columns: 4,
    				page: 0,
    				sort: 23,
    				perPage: 1,
    				perPageOptions: 5,
    				asc: 2,
    				loading: 6,
    				hideProgress: 7,
    				editable: 8,
    				sortable: 9,
    				pagination: 10,
    				scrollToTop: 11,
    				headerClasses: 12,
    				paginationClasses: 13,
    				editableClasses: 14,
    				paginatorProps: 15,
    				classes: 24
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTable",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get data() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columns() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columns(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get page() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sort() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sort(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get perPage() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set perPage(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get perPageOptions() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set perPageOptions(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get asc() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set asc(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideProgress() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideProgress(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editable() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editable(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sortable() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sortable(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pagination() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pagination(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollToTop() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollToTop(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headerClasses() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headerClasses(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paginationClasses() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paginationClasses(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editableClasses() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editableClasses(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paginatorProps() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paginatorProps(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\Switch\Switch.svelte generated by Svelte v3.24.0 */
    const file$k = "node_modules\\smelte\\src\\components\\Switch\\Switch.svelte";

    // (63:4) <Ripple color={value && !disabled ? color : 'gray'} noHover>
    function create_default_slot$7(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", /*th*/ ctx[6]);
    			attr_dev(div, "style", div_style_value = /*value*/ ctx[0] ? "left: 1.25rem" : "");
    			add_location(div, file$k, 63, 6, 1907);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*th*/ 64) {
    				attr_dev(div, "class", /*th*/ ctx[6]);
    			}

    			if (dirty & /*value*/ 1 && div_style_value !== (div_style_value = /*value*/ ctx[0] ? "left: 1.25rem" : "")) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(63:4) <Ripple color={value && !disabled ? color : 'gray'} noHover>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let div2;
    	let input;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let ripple;
    	let t2;
    	let label_1;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;

    	ripple = new Ripple({
    			props: {
    				color: /*value*/ ctx[0] && !/*disabled*/ ctx[3]
    				? /*color*/ ctx[2]
    				: "gray",
    				noHover: true,
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t1 = space();
    			create_component(ripple.$$.fragment);
    			t2 = space();
    			label_1 = element("label");
    			t3 = text(/*label*/ ctx[1]);
    			attr_dev(input, "class", "hidden");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$k, 59, 2, 1712);
    			attr_dev(div0, "class", "w-full h-full absolute");
    			add_location(div0, file$k, 61, 4, 1797);
    			attr_dev(div1, "class", /*tr*/ ctx[5]);
    			add_location(div1, file$k, 60, 2, 1776);
    			attr_dev(label_1, "aria-hidden", "true");
    			attr_dev(label_1, "class", /*l*/ ctx[7]);
    			add_location(label_1, file$k, 68, 2, 2004);
    			attr_dev(div2, "class", /*c*/ ctx[4]);
    			add_location(div2, file$k, 58, 0, 1677);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(ripple, div1, null);
    			append_dev(div2, t2);
    			append_dev(div2, label_1);
    			append_dev(label_1, t3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[14]),
    					listen_dev(input, "change", /*change_handler*/ ctx[13], false, false, false),
    					listen_dev(div2, "click", /*check*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			const ripple_changes = {};

    			if (dirty & /*value, disabled, color*/ 13) ripple_changes.color = /*value*/ ctx[0] && !/*disabled*/ ctx[3]
    			? /*color*/ ctx[2]
    			: "gray";

    			if (dirty & /*$$scope, th, value*/ 2097217) {
    				ripple_changes.$$scope = { dirty, ctx };
    			}

    			ripple.$set(ripple_changes);

    			if (!current || dirty & /*tr*/ 32) {
    				attr_dev(div1, "class", /*tr*/ ctx[5]);
    			}

    			if (!current || dirty & /*label*/ 2) set_data_dev(t3, /*label*/ ctx[1]);

    			if (!current || dirty & /*l*/ 128) {
    				attr_dev(label_1, "class", /*l*/ ctx[7]);
    			}

    			if (!current || dirty & /*c*/ 16) {
    				attr_dev(div2, "class", /*c*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ripple.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ripple.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(ripple);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const trackClassesDefault = "relative w-10 h-auto z-0 rounded-full overflow-visible flex items-center justify-center";
    const thumbClassesDefault = "rounded-full p-2 w-5 h-5 absolute elevation-3 duration-100";
    const labelClassesDefault = "pl-2 cursor-pointer";

    function instance$k($$self, $$props, $$invalidate) {
    	const classesDefault = `inline-flex items-center mb-2 cursor-pointer z-10`;
    	let { value = false } = $$props;
    	let { label = "" } = $$props;
    	let { color = "primary" } = $$props;
    	let { disabled = false } = $$props;
    	let { trackClasses = trackClassesDefault } = $$props;
    	let { thumbClasses = thumbClassesDefault } = $$props;
    	let { labelClasses = labelClassesDefault } = $$props;
    	let { classes = classesDefault } = $$props;
    	const cb = new ClassBuilder(classes, classesDefault);
    	const trcb = new ClassBuilder(trackClasses, trackClassesDefault);
    	const thcb = new ClassBuilder(thumbClasses, thumbClassesDefault);
    	const lcb = new ClassBuilder(labelClasses, labelClassesDefault);

    	function check() {
    		if (disabled) return;
    		$$invalidate(0, value = !value);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Switch", $$slots, []);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_change_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$new_props) $$invalidate(1, label = $$new_props.label);
    		if ("color" in $$new_props) $$invalidate(2, color = $$new_props.color);
    		if ("disabled" in $$new_props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ("trackClasses" in $$new_props) $$invalidate(9, trackClasses = $$new_props.trackClasses);
    		if ("thumbClasses" in $$new_props) $$invalidate(10, thumbClasses = $$new_props.thumbClasses);
    		if ("labelClasses" in $$new_props) $$invalidate(11, labelClasses = $$new_props.labelClasses);
    		if ("classes" in $$new_props) $$invalidate(12, classes = $$new_props.classes);
    	};

    	$$self.$capture_state = () => ({
    		Ripple,
    		ClassBuilder,
    		classesDefault,
    		trackClassesDefault,
    		thumbClassesDefault,
    		labelClassesDefault,
    		value,
    		label,
    		color,
    		disabled,
    		trackClasses,
    		thumbClasses,
    		labelClasses,
    		classes,
    		cb,
    		trcb,
    		thcb,
    		lcb,
    		check,
    		c,
    		tr,
    		th,
    		l
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$new_props.label);
    		if ("color" in $$props) $$invalidate(2, color = $$new_props.color);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ("trackClasses" in $$props) $$invalidate(9, trackClasses = $$new_props.trackClasses);
    		if ("thumbClasses" in $$props) $$invalidate(10, thumbClasses = $$new_props.thumbClasses);
    		if ("labelClasses" in $$props) $$invalidate(11, labelClasses = $$new_props.labelClasses);
    		if ("classes" in $$props) $$invalidate(12, classes = $$new_props.classes);
    		if ("c" in $$props) $$invalidate(4, c = $$new_props.c);
    		if ("tr" in $$props) $$invalidate(5, tr = $$new_props.tr);
    		if ("th" in $$props) $$invalidate(6, th = $$new_props.th);
    		if ("l" in $$props) $$invalidate(7, l = $$new_props.l);
    	};

    	let c;
    	let tr;
    	let th;
    	let l;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(4, c = cb.flush().add(classes, true, classesDefault).add($$props.class).get());

    		if ($$self.$$.dirty & /*value, color, trackClasses*/ 517) {
    			 $$invalidate(5, tr = trcb.flush().add("bg-gray-700", !value).add(`bg-${color}-200`, value).add(trackClasses, true, trackClassesDefault).get());
    		}

    		if ($$self.$$.dirty & /*thumbClasses, value, color*/ 1029) {
    			 $$invalidate(6, th = thcb.flush().add(thumbClasses, true, thumbClassesDefault).add("bg-white left-0", !value).add(`bg-${color}-400`, value).get());
    		}

    		if ($$self.$$.dirty & /*labelClasses, disabled*/ 2056) {
    			 $$invalidate(7, l = lcb.flush().add(labelClasses, true, labelClassesDefault).add("text-gray-500", disabled).add("text-gray-700", !disabled).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		label,
    		color,
    		disabled,
    		c,
    		tr,
    		th,
    		l,
    		check,
    		trackClasses,
    		thumbClasses,
    		labelClasses,
    		classes,
    		change_handler,
    		input_change_handler
    	];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {
    			value: 0,
    			label: 1,
    			color: 2,
    			disabled: 3,
    			trackClasses: 9,
    			thumbClasses: 10,
    			labelClasses: 11,
    			classes: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get value() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trackClasses() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trackClasses(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thumbClasses() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbClasses(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelClasses() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelClasses(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$l = "src\\App.svelte";

    // (59:0) <Snackbar color="error" top bind:value={showSnackbarTop}>
    function create_default_slot$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Send links to the bot!";
    			add_location(div, file$l, 59, 2, 1662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(59:0) <Snackbar color=\\\"error\\\" top bind:value={showSnackbarTop}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let div0;
    	let h6;
    	let t0;
    	let t1;
    	let t2;
    	let snackbar;
    	let updating_value;
    	let t3;
    	let div1;
    	let datatable;
    	let current;

    	function snackbar_value_binding(value) {
    		/*snackbar_value_binding*/ ctx[5].call(null, value);
    	}

    	let snackbar_props = {
    		color: "error",
    		top: true,
    		$$slots: { default: [create_default_slot$8] },
    		$$scope: { ctx }
    	};

    	if (/*showSnackbarTop*/ ctx[3] !== void 0) {
    		snackbar_props.value = /*showSnackbarTop*/ ctx[3];
    	}

    	snackbar = new Snackbar({ props: snackbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(snackbar, "value", snackbar_value_binding));

    	datatable = new DataTable({
    			props: {
    				data: /*data*/ ctx[0],
    				loading: /*loading*/ ctx[1],
    				columns: [
    					{
    						label: "ID",
    						field: "update_id",
    						class: "sm:w-10"
    					},
    					{
    						label: "user_id",
    						value: func$1,
    						class: "sm:w-10",
    						editable: false
    					},
    					{
    						label: "text",
    						value: func_1$1,
    						class: "sm:w-10",
    						editable: false
    					}
    				]
    			},
    			$$inline: true
    		});

    	datatable.$on("update", /*update_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h6 = element("h6");
    			t0 = text(/*name*/ ctx[2]);
    			t1 = text("!");
    			t2 = space();
    			create_component(snackbar.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			create_component(datatable.$$.fragment);
    			add_location(h6, file$l, 56, 2, 1578);
    			attr_dev(div0, "class", "container mx-auto h-full items-center");
    			add_location(div0, file$l, 55, 0, 1524);
    			attr_dev(div1, "class", "overflow-auto p-1");
    			add_location(div1, file$l, 61, 0, 1708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h6);
    			append_dev(h6, t0);
    			append_dev(h6, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(snackbar, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(datatable, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 4) set_data_dev(t0, /*name*/ ctx[2]);
    			const snackbar_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				snackbar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*showSnackbarTop*/ 8) {
    				updating_value = true;
    				snackbar_changes.value = /*showSnackbarTop*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			snackbar.$set(snackbar_changes);
    			const datatable_changes = {};
    			if (dirty & /*data*/ 1) datatable_changes.data = /*data*/ ctx[0];
    			if (dirty & /*loading*/ 2) datatable_changes.loading = /*loading*/ ctx[1];
    			datatable.$set(datatable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(snackbar.$$.fragment, local);
    			transition_in(datatable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(snackbar.$$.fragment, local);
    			transition_out(datatable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			destroy_component(snackbar, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_component(datatable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = v => `${v.message.from.id}`;
    const func_1$1 = v => `${v.message.text}`;

    function instance$l($$self, $$props, $$invalidate) {
    	let { data = [] } = $$props;
    	let { loading = true } = $$props;
    	let { matches = [] } = $$props;
    	let { name } = $$props;
    	let showSnackbarTop = false;

    	async function getData() {
    		if (typeof window === "undefined") return;
    		$$invalidate(1, loading = true);
    		var token = "YOUR-TOKEN-HERE";
    		var tg = "https://api.telegram.org/bot" + token;
    		var method = "/getUpdates";
    		var fetch_url = tg + method;
    		const res = await fetch(fetch_url);
    		const body = await res.json();
    		$$invalidate(0, data = body.result);
    		var n = Object.keys(data).length;

    		function notify() {
    			notifier.notify(message);
    		}

    		let message = "";

    		try {
    			var offset = data[n - 1].update_id + 1;
    		} catch(error) {
    			$$invalidate(3, showSnackbarTop = true);
    		}

    		console.log(n, data);
    		var count = 0;

    		try {
    			var regex = /\bhttps?:\/\/\S+/gi;

    			for (var i = 0; i < n; i++) {
    				var str = data[i].message.text;
    				$$invalidate(4, matches = str.match(regex));

    				if (matches != null) {
    					chrome.tabs.create({ url: matches[0], active: false });
    					count += 1;
    				}
    			}
    		} catch(error) {
    			console.log(error);
    		}

    		if (count > 0) {
    			var notify = tg + "/sendMessage?chat_id=691609650&text=" + count + " tabs were opened!";
    			fetch(notify);
    			var clear = tg + "/getUpdates?offset=" + offset;
    			fetch(clear);
    		}

    		setTimeout(() => $$invalidate(1, loading = false), 500);
    	}

    	getData();
    	const writable_props = ["data", "loading", "matches", "name"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function snackbar_value_binding(value) {
    		showSnackbarTop = value;
    		$$invalidate(3, showSnackbarTop);
    	}

    	const update_handler = ({ detail }) => {
    		const { column, item, value } = detail;
    		const index = data.findIndex(i => i.update_id === item.update_id);
    		$$invalidate(0, data[index][column.field] = value, data);
    	};

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    		if ("matches" in $$props) $$invalidate(4, matches = $$props.matches);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		Checkbox,
    		Switch,
    		Snackbar,
    		DataTable,
    		data,
    		loading,
    		matches,
    		name,
    		showSnackbarTop,
    		getData
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("loading" in $$props) $$invalidate(1, loading = $$props.loading);
    		if ("matches" in $$props) $$invalidate(4, matches = $$props.matches);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("showSnackbarTop" in $$props) $$invalidate(3, showSnackbarTop = $$props.showSnackbarTop);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		loading,
    		name,
    		showSnackbarTop,
    		matches,
    		snackbar_value_binding,
    		update_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { data: 0, loading: 1, matches: 4, name: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[2] === undefined && !("name" in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get data() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get matches() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set matches(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: 'Open In Browser'
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

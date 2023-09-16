// ==UserScript==
// @name         code-plus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  解放鼠标，学码快人一步！ 代码随想录网站辅助工具, 支持快速跳转到指定语言类型, 跳转到leetcode对应题目, 首次打开跳转到上次位置，切换前后文章
// @author       righthan
// @match        https://www.programmercarl.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastKeyPressTime = 0; // 用于存储上一次按键的时间戳

    let page = document.querySelector('.page')
    let sider = document.querySelector('.page-sidebar')
    let siderLinks = document.querySelector('.sidebar-links')
    let isDoubleKeyG = false; // 标识是否是第一次按G键


    // 跳转到上次浏览的网页
    let historyPath = getCookie('history')
    if (historyPath && encodeURI(historyPath) !== location.href) {
        toPath(historyPath)
    } else {
        setCookie('history', location.href)
    }

    // 给导航容器列表添加监听器，检测网址变化
    siderLinks.addEventListener('click', (e) => { setCookie('history', e.target.href) })

    // 如果cookie中没有语言， 则需要设置
    const lang = getCookie('lang')
    if (!lang) { setCodeLanguage() }

    document.addEventListener("keyup", function (event) {
        // 检测是否快速连按了g开头的组合键
        const key = event.key
        if (key === 'g') {
            let currentTime = new Date().getTime(); // 更新第一次按g键的时间戳
            if (currentTime - lastKeyPressTime < 300) {
                isDoubleKeyG = true
            } else {
                isDoubleKeyG = false
            }
            lastKeyPressTime = currentTime
        }

        let currentTime = new Date().getTime(); // 获取当前时间戳
        let time = currentTime - lastKeyPressTime
        if (time < 400) { // 如果两次按键的时间间隔小于400毫秒，认为是快速连按
            switch (key) {
                case 'g':
                    if (isDoubleKeyG && lang) {
                        toCode()
                        isDoubleKeyG = false
                    } else if (isDoubleKeyG && !lang) {
                        setCodeLanguage()
                    }
                    break
                case 'k':
                    // 跳转到上一篇文章
                    changeArticle(0)
                    break
                case 'j':
                    // 跳转到下一篇文章
                    changeArticle(1)
                    break
                case 'l':
                    toLeetCode()
                    break
                case 'c':
                    setCodeLanguage()
                    break
                case 'h':
                    alert(`
                    code-plus是一款网页操作快捷辅助工具
                    按键及功能如下:
                    gg: 跳转到指定语言代码
                    gj: 跳转到下一篇
                    gk: 跳转到上一篇
                    gl: 跳转到leetcode页面
                    gc: 设置代码语言(保存在网站的cookie中)
                    gh: 显示本帮助页面
                    其他功能: 打开网页时恢复上次的进度
                    `)
                    break
            }
        }
    });
    // 跳转到指定语言的算法代码
    function toCode() {
        // 获取对要滚动到的元素的引用
        let targetElement = page.querySelector('#' + getCookie('lang'));
        if (targetElement) { // 确保找到了元素
            // 使用scrollIntoView()方法将元素滚动到可见区域
            targetElement.scrollIntoView({
                behavior: "smooth", // 可选：使滚动平滑进行
                block: "start", // 可选：滚动到元素的顶部
            });
        } else {
            const lang = getCookie('lang')
            alert((lang !== 'c-2' ? lang : 'c#') + '语言的代码在此页面中不存在')
        }
    }
    // 文章跳转 flag:1表示下跳转到下一篇文章, 0表示上一篇文章
    function changeArticle(flag) {
        let optionButton = sider.querySelectorAll('div[title]')
        let path = optionButton[flag].childNodes[0].href
        toPath(decodeURI(path))
    }

    // 跳转到leetcode刷题网站
    function toLeetCode() {
        let link = page.querySelector('a[href*="leetcode"] ')
        if (link && link.href.includes('leetcode')) {
            link.click()
        } else {
            alert("当前页面可能没有LeetCode题目")
        }
    }
    // 设置代码语言
    function setCodeLanguage() {
        const supportLang = ['java', 'python', 'go', 'rust', 'javascript', 'typescript', 'swift', 'ruby', 'c', 'php', 'kotlin', 'scala', 'c#']
        let userInput = window.prompt("可能支持的语言:\n(一些语言代码不是每题都有, c++代码在靠前的位置, 不需要配置)\n" + supportLang.join('/') + "\n请输入需要快速跳转到的目标语言")

        if (userInput !== null) {
            if (supportLang.includes(userInput)) {
                // c#的id为c-2
                if (userInput === 'c#') { userInput = 'c-2' }
                setCookie('lang', userInput)
            } else {
                alert(userInput + "的语言类型似乎没有对应的代码, 请检查拼写, 并重新输入")
            }
        }
    }
    // 跳转对对应路径的页面
    function toPath(path) {
        setCookie('history', path)
        const paths = path.split('/')
        // 获取 .html之前的路径名
        const subPath = paths[paths.length - 1].split('.html')[0]
        clickAndScrollNavLink(subPath)
    }
    // 点击对应链接, 并且滚动侧边导航
    function clickAndScrollNavLink(path) {
        let targetElement = siderLinks.querySelector(`a[href*="${path}"]`)
        if (targetElement) { // 确保找到了元素
            targetElement.click()
            // 使用scrollIntoView() // 方法将元素滚动到可见区域
            targetElement.scrollIntoView({
                block: "start", // 可选：滚动到元素的顶部
            });
            document.querySelector('.sidebar').scrollBy({ top: -300 })
        }
    }
    // 解析特定的cookie值
    function getCookie(cookieName) {
        const allCookies = document.cookie;
        let name = cookieName + "=";
        let decodedCookie = decodeURIComponent(allCookies);
        let cookieArray = decodedCookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return "";
    }
    function setCookie(key, val) {
        document.cookie = `${key}=${val}; expires=Fri, 31 Dec 9999 23:59:59 GMT`
    }
})();
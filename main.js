/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
navToggle = document.getElementById('nav-toggle'),
navClose = document.getElementById('nav-close')

/*=============== MENU SHOW ===============*/
if(navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show-menu')
    })
}

/*=============== MENU HIDDEN ===============*/
if(navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show-menu')
    })
}

/*=============== REMOVE MENU MOBILE ===============*/
const navLink = document.querySelectorAll('.nav_link')

const linkAction = () => {
    const navMenu = document.getElementById('nav-menu')
    navMenu.classList.remove('show-menu')
}

navLink.forEach(n => n.addEventListener('click', linkAction))

/*=============== CHANGE BACKGROUND HEADER ===============*/
const scrollHeader = () => {
    const header = document.getElementById('header')
    this.scrollY >= 50 ? header.classList.add('bg-header')
    : header.classList.remove('bg-header')
}
window.addEventListener('scroll', scrollHeader)

/*=============== SHOW SCROLL UP ===============*/
const scrollUp = () => {
    const scrollUp = document.getElementById('scrollup')
    this.scrollY >= 350 ? scrollUp.classList.add('scrollup') : scrollUp.classList.remove('scrollup')
}
window.addEventListener('scroll', scrollUp)

/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
const sections = document.querySelectorAll('section[id]')

const scrollAction = () => {
    const scrollY =window.pageYOffset
    
    sections.forEach(current => {
        const sectionHeight = current.offsetHeight,
            sectionTop = current.offsetTop - 58,
            sectionId = current.getAttribute('id'),
            sectionsClass = document.querySelector('.nav_menu a[href*=' + sectionId + ']')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            sectionsClass.classList.add('active-link')
        }
        else {
            sectionsClass.classList.remove('action-link')
        }
    })
}
window.addEventListener('scroll', scrollAction)

/*=============== DARK LIGHT THEME ===============*/
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'ri-sun-line'

// PREVIOUSLY SECLECTED TOPIC
const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

const getCurrentTheme = () => document.body.classList.contains (darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains (iconTheme) ? 'ri-moon-line' : 'ri-sun-light'

if (selectedTheme) {
    document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'] (darkTheme)
    themeButton.classList[selectedIcon === 'ri-moon-line' ? 'add' : 'remove'] (iconTheme)
}

themeButton.addEventListener('click', () => {
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(iconTheme)

    localStorage.setItem('selected-theme', getCurrentTheme())
    localStorage.setItem('selected-icon', getCurrentIcon())
})

/*=============== SCROLL REVEAL ANIMATION ===============*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2500,
    delay: 400,
})

sr.reveal('.home_img, .newsletter_container, .footer_logo, .footer_description, .footer_content, .footer_info')
sr.reveal('.home_data', {origin: 'bottom'})
sr.reveal('.about_data, .recently_data', {origin: 'left'})
sr.reveal('.about_img, .recently_img', {origin: 'right'})
sr.reveal('.popular_card', {interval: 100})

/* SHOW LOGIN MODAL ON 'ORDER NOW' CLICK */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('auth-modal')
  const closeBtn = document.getElementById('auth-close')
  const orderButtons = document.querySelectorAll('.order-now')

  if (modal && closeBtn && orderButtons.length > 0) {
    orderButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        modal.style.display = 'flex'
        showLogin()  
      })
    })

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none'
    })

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none'
      }
    })
  } else {
    console.warn("❌ Cannot find modal or closebutton or orderbutton.")
  }
})

function showLogin() {
  document.getElementById("login-form").classList.add("active")
  document.getElementById("register-form").classList.remove("active")
}

function showRegister() {
  document.getElementById("login-form").classList.remove("active")
  document.getElementById("register-form").classList.add("active")
}

function moveToLogin() {
  //document.getElementById("form-container").style.transform = "translateX(0%)"
  showLogin()
}

function moveToRegister() {
  //document.getElementById("form-container").style.transform = "translateX(0%)"
  showRegister()
}

const skillsContent = document.getElementsByClassName('skills__content'),
    skillsHeader = document.querySelectorAll('.skills__header')

function toggleSkills() {
    let itemClass = this.parentNode.className
    for (i = 0; i < skillsContent.length; i++) {
        skillsContent[i].className = 'skills__content skills__close'
    }
    if (itemClass === 'skills__content skills__close') {
        this.parentNode.className = 'skills__content skills__open'
    }  
    
}
skillsHeader.forEach((el) => {
        el.addEventListener('click', toggleSkills)
    })


const sections = document.querySelectorAll('section[id')
function scrollActive() {
    const scrollY = window.pageYOffset
    
    sections.forEach(current => {
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        sectionId = current.getAttribute('id')
    
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelector('.nav li ul a[href*=' + sectionId + ']').classList.add('active')
        } else {
            document.querySelector('.nav li ul a[href*=' + sectionId + ']').classList.remove('active')
        }
    })
}
window.addEventListener('scroll', scrollActive)



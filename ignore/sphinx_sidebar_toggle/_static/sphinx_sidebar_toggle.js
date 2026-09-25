document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'sidebar-toggle-btn';
    toggleBtn.innerHTML = '☰ Menu';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation Sidebar');

    document.body.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-collapsed');
    });
});
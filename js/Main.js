// Fetching repositories from the GitHub API
fetch('https://api.github.com/users/Runarok/repos')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch repositories from GitHub API.');
    }
    return response.json();
  })
  .then(data => {
    const menu = document.getElementById('menu');
    if (data.length === 0) {
      menu.innerHTML = '<p>No repositories found.</p>';
      return;
    }

    data.forEach(repo => {
      const container = document.createElement('div');
      container.classList.add('repo-container');
      
      const name = document.createElement('div');
      name.classList.add('repo-name');
      name.textContent = repo.name;

      const actions = document.createElement('div');
      actions.classList.add('repo-actions');

      const repoButton = document.createElement('button');
      repoButton.classList.add('repo-button', 'repo');
      repoButton.textContent = 'Repo';
      repoButton.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
          // Middle-click, open in new tab
          window.open(repo.html_url, '_blank');
        } else {
          // Left-click, open in the same tab
          window.location.href = repo.html_url;
        }
      });

      const pagesButton = document.createElement('button');
      pagesButton.classList.add('repo-button', 'pages');
      pagesButton.textContent = 'Pages';
      pagesButton.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
          // Middle-click, open in new tab
          window.open(`https://${repo.owner.login}.github.io/${repo.name}/`, '_blank');
        } else {
          // Left-click, open in the same tab
          window.location.href = `https://${repo.owner.login}.github.io/${repo.name}/`;
        }
      });

      actions.appendChild(repoButton);
      actions.appendChild(pagesButton);
      container.appendChild(name);
      container.appendChild(actions);

      menu.appendChild(container);
    });
  })
  .catch(error => {
    console.error('Error fetching repositories:', error);
    document.getElementById('menu').innerHTML = '<p>Failed to load repositories. Please try again later.</p>';
  });

// Open info.html on keypress or zigzag swipe
function openInfoPage() {
  window.location.href = "info.html";
}

// Keydown event for I and Z keys
document.addEventListener('keydown', (e) => {
  if (['i', 'z'].includes(e.key.toLowerCase())) openInfoPage();
});

// Swipe detection variables
let touchStart = { x: 0, y: 0 };

document.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

document.addEventListener('touchend', (e) => {
  const { x, y } = e.changedTouches[0];
  if (Math.abs(x - touchStart.x) > 50 && Math.abs(y - touchStart.y) > 50) openInfoPage();
});

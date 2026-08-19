// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  
  themeToggle.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    themeToggle.style.transform = 'rotate(0deg)';
  }, 300);
});

// Animate Progress Bars
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-fill');
  
  progressBars.forEach((bar, index) => {
    const progress = bar.getAttribute('data-progress');
    setTimeout(() => {
      bar.style.width = progress + '%';
    }, index * 150);
  });
}

// Animate Bar Chart
function animateBarChart() {
  const chartBars = document.querySelectorAll('.bar-fill');
  
  chartBars.forEach((bar, index) => {
    const parentBar = bar.parentElement;
    const height = parentBar.getAttribute('data-height');
    
    setTimeout(() => {
      bar.style.height = height + '%';
    }, 800 + (index * 100));
  });
}

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains('metrics-grid')) {
        animateProgressBars();
      }
      if (entry.target.classList.contains('bar-chart')) {
        animateBarChart();
      }
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements
const metricsGrid = document.querySelector('.metrics-grid');
const barChart = document.querySelector('.bar-chart');

if (metricsGrid) observer.observe(metricsGrid);
if (barChart) observer.observe(barChart);

// Counter Animation for Metric Values
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    
    if (element.textContent.includes('$')) {
      element.textContent = '$' + Math.floor(current).toLocaleString();
    } else if (element.textContent.includes('%')) {
      element.textContent = current.toFixed(2) + '%';
    } else {
      element.textContent = Math.floor(current).toLocaleString();
    }
  }, 16);
}

// Animate metric values on load
window.addEventListener('load', () => {
  const metricValues = document.querySelectorAll('.metric-value');
  
  metricValues.forEach((metric, index) => {
    const text = metric.textContent;
    let targetValue;
    
    if (text.includes('$')) {
      targetValue = parseFloat(text.replace(/[$,]/g, ''));
    } else if (text.includes('%')) {
      targetValue = parseFloat(text.replace('%', ''));
    } else {
      targetValue = parseFloat(text.replace(/,/g, ''));
    }
    
    metric.textContent = text.includes('$') ? '$0' : (text.includes('%') ? '0%' : '0');
    
    setTimeout(() => {
      animateCounter(metric, targetValue);
    }, 300 + (index * 150));
  });
});

// Hover effect for metric cards
document.querySelectorAll('.metric-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    const icon = this.querySelector('.metric-icon');
    icon.style.transform = 'scale(1.1) rotate(5deg)';
  });
  
  card.addEventListener('mouseleave', function() {
    const icon = this.querySelector('.metric-icon');
    icon.style.transform = 'scale(1) rotate(0deg)';
  });
});

// Add pulse animation to trend badges
document.querySelectorAll('.trend-badge').forEach(badge => {
  setInterval(() => {
    badge.style.transform = 'scale(1.05)';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
    }, 150);
  }, 3000);
});

// Smooth scroll for stat rows
document.querySelectorAll('.stat-row').forEach((row, index) => {
  row.style.opacity = '0';
  row.style.transform = 'translateX(-20px)';
  
  setTimeout(() => {
    row.style.transition = 'all 0.5s ease';
    row.style.opacity = '1';
    row.style.transform = 'translateX(0)';
  }, 1000 + (index * 100));
});

// Console branding
console.log('%c Analytics Dashboard by Kiara Sinha ', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold;');

// Simulate real-time data updates
setInterval(() => {
  const trendBadges = document.querySelectorAll('.trend-badge span');
  trendBadges.forEach(badge => {
    const currentValue = parseFloat(badge.textContent);
    const newValue = (currentValue + (Math.random() - 0.5) * 0.2).toFixed(1);
    badge.textContent = Math.abs(newValue) + '%';
  });
}, 5000);

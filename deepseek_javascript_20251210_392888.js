// Полные данные всех 280 пунктов обогрева
const heatingPoints = [
    // г. Кокшетау (6 пунктов)
    {id: 1, city: "г. Кокшетау", district: "г. Кокшетау", point: "ТОО «Кулагер-Кокше»", capacity: "20/15", contacts: "Сердюкова Галина Николаевна, 87013303007", road: "Трасса «Кокшетау – Щучинск»"},
    // ... остальные данные
    {id: 280, city: "с. Жана Жайнак", district: "Целиноградский район", point: "КГУ «Общеобразовательная школа с. Жанажайнак»", capacity: "50/-", contacts: "Жапан Баянгонус, 87068526914", road: "А/д «Нуресиль – Жанаесиль – Зелёный Гай»"}
];

// Данные зарядных станций
const chargingStations = [
    {id: 1, location: "а/д А-1 Астана-Петропавловск 18 км справа АЗС", connectors: ["GB/T 80кВт", "CCS 2 80кВт"], schedule: "круглосуточно", power: "100Т/кВт-ч", operator: "QazaqEnergyCharge №10", road: "А-1", lat: 51.2, lng: 71.4, powerNum: 80},
    // ... остальные данные
    {id: 7, location: "а/д М-36 Екатеринбург-Алматы км 1284 АЗС", connectors: ["GB/T 160кВт", "CCS 2 160кВт"], schedule: "круглосуточно", power: "100Т/кВт-ч", operator: "Qazaq Energy Charge №31", road: "М-36", lat: 51.1, lng: 71.3, powerNum: 160}
];

// Переменные для пагинации и фильтрации
let heatingCurrentPage = 1;
let chargingCurrentPage = 1;
const itemsPerPage = 20;
let filteredHeatingData = [...heatingPoints];
let filteredChargingData = [...chargingStations];

// Карты
let chargingMap, roadsMap;
let chargingMarkers = [];

// Навигация по вкладкам
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Убираем активный класс у всех вкладок
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Добавляем активный класс к выбранной вкладке
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // Если открыта вкладка с картами, инициализируем их
        if (tabId === 'heating') {
            renderHeatingTable();
        } else if (tabId === 'charging') {
            if (!chargingMap) {
                initChargingMap();
            } else {
                updateChargingMapMarkers();
                chargingMap.invalidateSize();
            }
            renderChargingTable();
        } else if (tabId === 'roads') {
            if (!roadsMap) {
                initRoadsMap();
            } else {
                roadsMap.invalidateSize();
            }
        }
    });
});

// Инициализация карты зарядных станций
function initChargingMap() {
    chargingMap = L.map('chargingMap').setView([51.5, 71.0], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(chargingMap);
    
    updateChargingMapMarkers();
}

// Инициализация карты дорог
function initRoadsMap() {
    roadsMap = L.map('roadsMap').setView([51.5, 71.0], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(roadsMap);
    
    // Добавляем линии основных дорог (упрощённо)
    const roads = [
        {name: "А-1", coords: [[51.18, 71.45], [51.3, 71.5], [51.5, 71.8], [52.0, 72.5]]},
        {name: "М-36", coords: [[50.5, 69.5], [51.1, 71.3], [51.5, 72.5]]},
        {name: "Кокшетау-Щучинск", coords: [[53.3, 69.4], [52.9, 70.2]]},
        {name: "Кокшетау-Атбасар", coords: [[53.3, 69.4], [52.0, 68.5]]}
    ];
    
    roads.forEach(road => {
        L.polyline(road.coords, {
            color: '#0057b8',
            weight: 4,
            opacity: 0.7
        }).addTo(roadsMap).bindPopup(`<strong>Трасса ${road.name}</strong>`);
    });
}

// Обновление маркеров зарядных станций
function updateChargingMapMarkers() {
    chargingMarkers.forEach(marker => chargingMap.removeLayer(marker));
    chargingMarkers = [];
    
    filteredChargingData.forEach(station => {
        const iconColor = station.powerNum >= 160 ? 'orange' : (station.powerNum >= 100 ? 'blue' : 'green');
        
        const customIcon = L.divIcon({
            html: `<div class="ev-icon ${iconColor}"><i class="fas fa-charging-station"></i></div>`,
            iconSize: [30, 30],
            className: 'ev-marker'
        });
        
        const marker = L.marker([station.lat, station.lng], { icon: customIcon })
            .addTo(chargingMap)
            .bindPopup(`
                <div>
                    <h3>Зарядная станция №${station.id}</h3>
                    <div class="popup-info"><span class="popup-label">Местоположение:</span> ${station.location}</div>
                    <div class="popup-info"><span class="popup-label">Типы разъёмов:</span> ${station.connectors.join(', ')}</div>
                    <div class="popup-info"><span class="popup-label">Мощность:</span> ${station.power}</div>
                    <div class="popup-info"><span class="popup-label">График работы:</span> ${station.schedule}</div>
                    <div class="popup-info"><span class="popup-label">Оператор:</span> ${station.operator}</div>
                    <div class="popup-info"><span class="popup-label">Трасса:</span> ${station.road}</div>
                </div>
            `);
        
        chargingMarkers.push(marker);
    });
    
    if (chargingMarkers.length > 0) {
        const group = L.featureGroup(chargingMarkers);
        chargingMap.fitBounds(group.getBounds().pad(0.1));
    }
}

// Переключение между картой и таблицей для зарядных станций
document.getElementById('toggleChargingTable').addEventListener('click', function() {
    const tableSection = document.getElementById('chargingTableSection');
    const isTableVisible = tableSection.style.display !== 'none';
    
    if (isTableVisible) {
        tableSection.style.display = 'none';
        this.innerHTML = '<i class="fas fa-table"></i><span>Показать таблицу</span>';
        if (chargingMap) chargingMap.invalidateSize();
    } else {
        tableSection.style.display = 'block';
        this.innerHTML = '<i class="fas fa-map-marked-alt"></i><span>Показать карту</span>';
        renderChargingTable();
    }
});

// Функция отрисовки таблицы пунктов обогрева
function renderHeatingTable() {
    const tableBody = document.getElementById('heatingTableBody');
    const pagination = document.getElementById('heatingPagination');
    const showingElement = document.getElementById('heatingShowing');
    const totalElement = document.getElementById('heatingTotal');
    
    tableBody.innerHTML = '';
    pagination.innerHTML = '';
    
    const totalItems = filteredHeatingData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const startIndex = (heatingCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredHeatingData.slice(startIndex, endIndex);
    
    // Обновляем информацию о количестве данных
    showingElement.textContent = Math.min(endIndex, totalItems);
    totalElement.textContent = totalItems;
    
    pageData.forEach(item => {
        const hasBeds = item.capacity.includes('/') && !item.capacity.endsWith('/-');
        const capacityBadgeClass = hasBeds ? 'capacity-badge' : 'capacity-badge full';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>
                <div class="district-badge">${item.district}</div>
                ${item.city}
            </td>
            <td>${item.district}</td>
            <td>
                <strong>${item.point}</strong>
            </td>
            <td><span class="${capacityBadgeClass}">${item.capacity}</span></td>
            <td>${item.contacts}</td>
            <td>
                <div class="road-badge">${item.road}</div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    if (filteredHeatingData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center; padding: 40px;">По вашему запросу ничего не найдено</td>`;
        tableBody.appendChild(row);
    }
    
    // Пагинация
    if (totalPages > 1) {
        // Кнопка "Назад"
        if (heatingCurrentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevButton.addEventListener('click', () => {
                heatingCurrentPage--;
                renderHeatingTable();
            });
            pagination.appendChild(prevButton);
        }
        
        // Номера страниц
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= heatingCurrentPage - 2 && i <= heatingCurrentPage + 2)) {
                const button = document.createElement('button');
                button.textContent = i;
                button.classList.toggle('active', i === heatingCurrentPage);
                button.addEventListener('click', () => {
                    heatingCurrentPage = i;
                    renderHeatingTable();
                });
                pagination.appendChild(button);
            } else if (i === heatingCurrentPage - 3 || i === heatingCurrentPage + 3) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '10px 5px';
                pagination.appendChild(ellipsis);
            }
        }
        
        // Кнопка "Вперед"
        if (heatingCurrentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextButton.addEventListener('click', () => {
                heatingCurrentPage++;
                renderHeatingTable();
            });
            pagination.appendChild(nextButton);
        }
    }
}

// Функция отрисовки таблицы зарядных станций
function renderChargingTable() {
    const tableBody = document.getElementById('chargingTableBody');
    const pagination = document.getElementById('chargingPagination');
    const showingElement = document.getElementById('chargingShowing');
    const totalElement = document.getElementById('chargingTotal');
    
    tableBody.innerHTML = '';
    pagination.innerHTML = '';
    
    const totalItems = filteredChargingData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const startIndex = (chargingCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredChargingData.slice(startIndex, endIndex);
    
    // Обновляем информацию о количестве данных
    showingElement.textContent = Math.min(endIndex, totalItems);
    totalElement.textContent = totalItems;
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>
                <div class="road-badge">${item.road}</div>
                ${item.location}
            </td>
            <td>
                ${item.connectors.map(conn => {
                    const isGB = conn.includes('GB/T');
                    return `<span class="connector-badge ${isGB ? 'gb' : 'ccs'}">${conn}</span>`;
                }).join('')}
            </td>
            <td>${item.schedule}</td>
            <td>
                <span class="power-badge">${item.power}</span>
            </td>
            <td><strong>${item.operator}</strong></td>
            <td>${item.road}</td>
        `;
        tableBody.appendChild(row);
    });
    
    if (filteredChargingData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center; padding: 40px;">По вашему запросу ничего не найдено</td>`;
        tableBody.appendChild(row);
    }
    
    // Пагинация
    if (totalPages > 1) {
        // Кнопка "Назад"
        if (chargingCurrentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevButton.addEventListener('click', () => {
                chargingCurrentPage--;
                renderChargingTable();
            });
            pagination.appendChild(prevButton);
        }
        
        // Номера страниц
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= chargingCurrentPage - 2 && i <= chargingCurrentPage + 2)) {
                const button = document.createElement('button');
                button.textContent = i;
                button.classList.toggle('active', i === chargingCurrentPage);
                button.addEventListener('click', () => {
                    chargingCurrentPage = i;
                    renderChargingTable();
                });
                pagination.appendChild(button);
            } else if (i === chargingCurrentPage - 3 || i === chargingCurrentPage + 3) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '10px 5px';
                pagination.appendChild(ellipsis);
            }
        }
        
        // Кнопка "Вперед"
        if (chargingCurrentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextButton.addEventListener('click', () => {
                chargingCurrentPage++;
                renderChargingTable();
            });
            pagination.appendChild(nextButton);
        }
    }
}

// Поиск по таблице пунктов обогрева
document.getElementById('heatingSearchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    filteredHeatingData = heatingPoints.filter(item => 
        item.city.toLowerCase().includes(searchTerm) ||
        item.district.toLowerCase().includes(searchTerm) ||
        item.point.toLowerCase().includes(searchTerm) ||
        item.road.toLowerCase().includes(searchTerm) ||
        item.contacts.toLowerCase().includes(searchTerm)
    );
    heatingCurrentPage = 1;
    renderHeatingTable();
});

// Поиск по таблице зарядных станций
document.getElementById('chargingSearchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    filteredChargingData = chargingStations.filter(item => 
        item.location.toLowerCase().includes(searchTerm) ||
        item.operator.toLowerCase().includes(searchTerm) ||
        item.road.toLowerCase().includes(searchTerm) ||
        item.connectors.some(conn => conn.toLowerCase().includes(searchTerm))
    );
    chargingCurrentPage = 1;
    renderChargingTable();
    updateChargingMapMarkers();
});

// Фильтры для пунктов обогрева
document.getElementById('districtSelect').addEventListener('change', function() {
    const district = this.value;
    
    if (district === 'all') {
        filteredHeatingData = [...heatingPoints];
    } else {
        filteredHeatingData = heatingPoints.filter(item => 
            item.district.includes(district)
        );
    }
    
    // Сбрасываем активные кнопки фильтров
    document.querySelectorAll('#heating .filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterAll').classList.add('active');
    
    heatingCurrentPage = 1;
    renderHeatingTable();
});

document.querySelectorAll('#heating .filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('#heating .filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filterType = this.id;
        
        if (filterType === 'filterAll') {
            filteredHeatingData = [...heatingPoints];
        } else if (filterType === 'filterWithBeds') {
            filteredHeatingData = heatingPoints.filter(item => 
                item.capacity.includes('/') && !item.capacity.endsWith('/-')
            );
        } else if (filterType === 'filterHighway') {
            filteredHeatingData = heatingPoints.filter(item => 
                item.road.includes('Трасса') || item.road.includes('трасса')
            );
        }
        
    // Сбрасываем выбор района
        document.getElementById('districtSelect').value = 'all';
        
        heatingCurrentPage = 1;
        renderHeatingTable();
    });
});

// Фильтры для зарядных станций
document.querySelectorAll('#charging .filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('#charging .filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filterType = this.id;
        
        if (filterType === 'chargingFilterAll') {
            filteredChargingData = [...chargingStations];
        } else if (filterType === 'chargingFilterGB') {
            filteredChargingData = chargingStations.filter(item => 
                item.connectors.some(conn => conn.includes('GB/T'))
            );
        } else if (filterType === 'chargingFilterCCS') {
            filteredChargingData = chargingStations.filter(item => 
                item.connectors.some(conn => conn.includes('CCS 2'))
            );
        } else if (filterType === 'chargingFilterHighPower') {
            filteredChargingData = chargingStations.filter(item => 
                item.powerNum >= 160
            );
        }
        
        chargingCurrentPage = 1;
        renderChargingTable();
        updateChargingMapMarkers();
    });
});

// Экспорт данных пунктов обогрева
document.getElementById('exportHeating').addEventListener('click', function() {
    exportToCSV(filteredHeatingData, 'Пункты обогрева Акмолинской области', [
        {key: 'id', title: '№'},
        {key: 'city', title: 'Населённый пункт'},
        {key: 'district', title: 'Район'},
        {key: 'point', title: 'Пункт обогрева'},
        {key: 'capacity', title: 'Вместимость'},
        {key: 'contacts', title: 'Контакты'},
        {key: 'road', title: 'Дорога'}
    ]);
});

// Экспорт данных зарядных станций
document.getElementById('exportCharging').addEventListener('click', function() {
    exportToCSV(filteredChargingData, 'Зарядные станции Акмолинской области', [
        {key: 'id', title: '№'},
        {key: 'location', title: 'Местоположение'},
        {key: 'connectors', title: 'Типы разъёмов', formatter: (val) => val.join(', ')},
        {key: 'schedule', title: 'График работы'},
        {key: 'power', title: 'Мощность'},
        {key: 'operator', title: 'Оператор'},
        {key: 'road', title: 'Трасса'}
    ]);
});

// Функция экспорта в CSV
function exportToCSV(data, filename, columns) {
    if (data.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    
    // Заголовки
    const headers = columns.map(col => col.title);
    
    // Данные
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];
            if (col.formatter) {
                value = col.formatter(value);
            }
            // Экранируем кавычки и добавляем кавычки если есть запятые или кавычки
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
    });
    
    // Собираем CSV
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    // Создаем BLOB и скачиваем
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Данные экспортированы в файл: ${filename}.csv`);
}

// Обработка формы обратной связи
document.getElementById('feedbackForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    alert(`Спасибо, ${name}! Ваше сообщение отправлено. Мы ответим вам на email ${email} в ближайшее время.`);
    
    // Сбрасываем форму
    this.reset();
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Рисуем таблицу при первой загрузке
    renderHeatingTable();
    renderChargingTable();
    
    // Инициализируем карты при открытии соответствующих вкладок
    const activeTab = document.querySelector('.nav-tab.active').getAttribute('data-tab');
    if (activeTab === 'heating') {
        // Убрана инициализация карты обогрева
    } else if (activeTab === 'charging') {
        initChargingMap();
    } else if (activeTab === 'roads') {
        initRoadsMap();
    }
    
    // Анимация элементов
    const elements = document.querySelectorAll('.social-item, .phone-section, .stat-card, .road-info-card');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s, transform 0.5s';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100);
        }, index * 100);
    });
});
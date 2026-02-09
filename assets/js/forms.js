// assets/js/forms.js

// Validation des formulaires
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        // Récupérer tous les champs de formulaire
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const fieldName = input.name || input.id;
            if (fieldName) {
                this.fields[fieldName] = {
                    element: input,
                    rules: this.extractRules(input),
                    errors: []
                };
            }
        });
        
        // Événements de validation en temps réel
        this.setupRealTimeValidation();
        
        // Validation à la soumission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateAll()) {
                e.preventDefault();
                this.showAllErrors();
            }
        });
    }
    
    extractRules(input) {
        const rules = [];
        
        // Règles basées sur les attributs HTML5
        if (input.required) {
            rules.push({
                type: 'required',
                message: 'Ce champ est obligatoire'
            });
        }
        
        if (input.type === 'email') {
            rules.push({
                type: 'email',
                message: 'Veuillez entrer une adresse email valide'
            });
        }
        
        if (input.type === 'tel') {
            rules.push({
                type: 'phone',
                message: 'Veuillez entrer un numéro de téléphone valide'
            });
        }
        
        if (input.pattern) {
            rules.push({
                type: 'pattern',
                pattern: new RegExp(input.pattern),
                message: input.title || 'Format invalide'
            });
        }
        
        if (input.minLength) {
            rules.push({
                type: 'minLength',
                value: parseInt(input.minLength),
                message: `Minimum ${input.minLength} caractères requis`
            });
        }
        
        if (input.maxLength) {
            rules.push({
                type: 'maxLength',
                value: parseInt(input.maxLength),
                message: `Maximum ${input.maxLength} caractères autorisés`
            });
        }
        
        return rules;
    }
    
    setupRealTimeValidation() {
        Object.values(this.fields).forEach(field => {
            const input = field.element;
            
            input.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(field);
            });
        });
    }
    
    validateField(field) {
        const value = field.element.value.trim();
        field.errors = [];
        
        field.rules.forEach(rule => {
            let isValid = true;
            
            switch(rule.type) {
                case 'required':
                    isValid = value !== '';
                    break;
                    
                case 'email':
                    isValid = this.validateEmail(value);
                    break;
                    
                case 'phone':
                    isValid = this.validatePhone(value);
                    break;
                    
                case 'pattern':
                    isValid = rule.pattern.test(value);
                    break;
                    
                case 'minLength':
                    isValid = value.length >= rule.value;
                    break;
                    
                case 'maxLength':
                    isValid = value.length <= rule.value;
                    break;
            }
            
            if (!isValid) {
                field.errors.push(rule.message);
            }
        });
        
        if (field.errors.length > 0) {
            this.showFieldError(field);
            return false;
        } else {
            this.clearFieldError(field);
            return true;
        }
    }
    
    validateAll() {
        let isValid = true;
        
        Object.values(this.fields).forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    showFieldError(field) {
        const input = field.element;
        const formGroup = input.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.add('has-error');
            
            // Afficher le message d'erreur
            let errorElement = formGroup.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                formGroup.appendChild(errorElement);
            }
            
            errorElement.textContent = field.errors[0];
            errorElement.style.display = 'block';
        }
    }
    
    clearFieldError(field) {
        const input = field.element;
        const formGroup = input.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.remove('has-error');
            
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }
    
    showAllErrors() {
        Object.values(this.fields).forEach(field => {
            if (field.errors.length > 0) {
                this.showFieldError(field);
            }
        });
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    validatePhone(phone) {
        const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{2,4}[-\s.]?[0-9]{2,4}[-\s.]?[0-9]{0,9}$/;
        return re.test(phone);
    }
}

// Gestion des formulaires dynamiques
class DynamicForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.templateSelectors = {};
        this.init();
    }
    
    init() {
        // Rechercher les champs de type template
        const templateFields = this.form.querySelectorAll('[data-template]');
        
        templateFields.forEach(field => {
            const templateId = field.getAttribute('data-template');
            this.templateSelectors[field.name] = templateId;
            
            field.addEventListener('change', (e) => {
                this.loadTemplateData(e.target.value, templateId);
            });
            
            // Charger les options initiales
            if (field.value) {
                this.loadTemplateData(field.value, templateId);
            }
        });
        
        // Gestion des champs dynamiques (ajout/suppression)
        this.setupDynamicFields();
    }
    
    async loadTemplateData(value, templateId) {
        const targetField = this.form.querySelector(`[data-for="${templateId}"]`);
        if (!targetField) return;
        
        try {
            // Simuler le chargement des données
            const response = await fetch(`../data/${value}.json`);
            const data = await response.json();
            
            // Mettre à jour le champ cible
            this.updateFieldWithData(targetField, data);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }
    
    updateFieldWithData(field, data) {
        if (field.tagName === 'SELECT') {
            // Vider les options existantes (sauf la première)
            while (field.options.length > 1) {
                field.remove(1);
            }
            
            // Ajouter les nouvelles options
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id || item.code;
                option.textContent = item.nom || item.name;
                field.appendChild(option);
            });
        } else if (field.tagName === 'INPUT' && field.type === 'text') {
            // Pour les champs de recherche
            field.setAttribute('list', `datalist-${field.name}`);
            
            // Créer ou mettre à jour la datalist
            let datalist = document.getElementById(`datalist-${field.name}`);
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = `datalist-${field.name}`;
                field.after(datalist);
            }
            
            datalist.innerHTML = '';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.nom || item.name;
                option.setAttribute('data-value', item.id || item.code);
                datalist.appendChild(option);
            });
        }
    }
    
    setupDynamicFields() {
        // Boutons d'ajout
        const addButtons = this.form.querySelectorAll('.btn-add-field');
        
        addButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.addDynamicField(button);
            });
        });
        
        // Suppression dynamique (délégué)
        this.form.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-field')) {
                e.preventDefault();
                this.removeDynamicField(e.target);
            }
        });
    }
    
    addDynamicField(button) {
        const templateId = button.getAttribute('data-template');
        const containerId = button.getAttribute('data-container');
        const container = document.getElementById(containerId);
        
        if (!templateId || !container) return;
        
        const template = document.getElementById(templateId);
        if (!template) return;
        
        const clone = template.content.cloneNode(true);
        const index = container.children.length;
        
        // Mettre à jour les noms et IDs
        clone.querySelectorAll('[name], [id]').forEach(element => {
            if (element.name) {
                element.name = element.name.replace('[]', `[${index}]`);
            }
            if (element.id) {
                element.id = `${element.id}_${index}`;
            }
        });
        
        container.appendChild(clone);
    }
    
    removeDynamicField(button) {
        const fieldContainer = button.closest('.dynamic-field');
        if (fieldContainer) {
            fieldContainer.remove();
        }
    }
    
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key.endsWith('[]')) {
                const cleanKey = key.replace('[]', '');
                if (!data[cleanKey]) {
                    data[cleanKey] = [];
                }
                data[cleanKey].push(value);
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    resetForm() {
        this.form.reset();
        
        // Réinitialiser les champs dynamiques
        Object.keys(this.templateSelectors).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.dispatchEvent(new Event('change'));
            }
        });
        
        // Supprimer les champs dynamiques ajoutés
        const dynamicFields = this.form.querySelectorAll('.dynamic-field');
        dynamicFields.forEach(field => {
            if (!field.hasAttribute('data-original')) {
                field.remove();
            }
        });
    }
}

// Fonctions utilitaires pour les formulaires
function setupDatePickers() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // Définir la date d'aujourd'hui comme valeur par défaut si nécessaire
        if (input.hasAttribute('data-today')) {
            const today = new Date().toISOString().split('T')[0];
            input.value = today;
        }
        
        // Définir les limites de date
        if (input.hasAttribute('data-min-today')) {
            const today = new Date().toISOString().split('T')[0];
            input.min = today;
        }
        
        if (input.hasAttribute('data-max-today')) {
            const today = new Date().toISOString().split('T')[0];
            input.max = today;
        }
    });
}

function setupAutoComplete() {
    const autocompleteFields = document.querySelectorAll('[data-autocomplete]');
    
    autocompleteFields.forEach(field => {
        const source = field.getAttribute('data-autocomplete');
        
        field.addEventListener('input', async (e) => {
            const searchTerm = e.target.value;
            
            if (searchTerm.length < 2) return;
            
            try {
                const response = await fetch(`../data/${source}.json`);
                const data = await response.json();
                
                const suggestions = data.filter(item =>
                    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.code.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                showAutocompleteSuggestions(field, suggestions);
            } catch (error) {
                console.error('Erreur lors de l\'autocomplétion:', error);
            }
        });
    });
}

function showAutocompleteSuggestions(field, suggestions) {
    // Supprimer les suggestions précédentes
    const existingList = field.nextElementSibling;
    if (existingList && existingList.classList.contains('autocomplete-list')) {
        existingList.remove();
    }
    
    if (suggestions.length === 0) return;
    
    const list = document.createElement('ul');
    list.className = 'autocomplete-list';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('li');
        item.textContent = `${suggestion.nom} (${suggestion.code})`;
        item.dataset.value = suggestion.id;
        
        item.addEventListener('click', () => {
            field.value = suggestion.nom;
            field.dataset.selectedId = suggestion.id;
            list.remove();
        });
        
        list.appendChild(item);
    });
    
    field.after(list);
    
    // Fermer la liste en cliquant ailleurs
    document.addEventListener('click', function closeList(e) {
        if (!field.contains(e.target) && !list.contains(e.target)) {
            list.remove();
            document.removeEventListener('click', closeList);
        }
    });
}

// Initialisation des formulaires au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les validateurs pour tous les formulaires
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.id) {
            new FormValidator(form.id);
        }
    });
    
    // Initialiser les formulaires dynamiques
    const dynamicForms = document.querySelectorAll('form[data-dynamic]');
    dynamicForms.forEach(form => {
        if (form.id) {
            new DynamicForm(form.id);
        }
    });
    
    // Configurer les date pickers
    setupDatePickers();
    
    // Configurer l'autocomplétion
    setupAutoComplete();
    
    // Gestion des téléchargements de fichiers
    setupFileUploads();
});

function setupFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const files = e.target.files;
            const container = document.getElementById(`${input.id}-preview`);
            
            if (!container) return;
            
            container.innerHTML = '';
            
            Array.from(files).forEach(file => {
                const preview = document.createElement('div');
                preview.className = 'file-preview';
                
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    preview.appendChild(img);
                }
                
                const info = document.createElement('div');
                info.innerHTML = `
                    <strong>${file.name}</strong><br>
                    <small>${(file.size / 1024).toFixed(2)} KB</small>
                `;
                preview.appendChild(info);
                
                container.appendChild(preview);
            });
        });
    });
}

// Exportation des classes
window.FormValidator = FormValidator;
window.DynamicForm = DynamicForm;
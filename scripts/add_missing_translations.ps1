# Script to add missing translation keys to all languages
# This adds 24 new keys to each non-English language

$filePath = "c:\Users\agnib\OneDrive\Desktop\Web dashboard\Smart Meter\src\components\translations.tsx"
$content = Get-Content $filePath -Raw

# Define translations for each language
$translations = @{
    'it' = @"
    
    // Settings Page - Additional UI elements
    'saving': 'Salvataggio...',
    'save_changes': 'Salva Modifiche',
    'passwords_not_match': 'Le password non corrispondono',
    'updating': 'Aggiornamento...',
    'location_currency': 'Posizione e Valuta',
    'use_current_location': 'Usa Posizione Corrente (GPS)',
    'auto_detected': 'Rilevato automaticamente',
    'not_set': 'Non impostato',
    'timezone_auto_message': 'Il fuso orario è impostato automaticamente in base alla tua posizione GPS',
    'theme': 'Tema',
    'theme_changed': 'Tema cambiato in',
    'data_refresh_rate': 'Frequenza di Aggiornamento Dati',
    'refresh_rate_set': 'Frequenza di aggiornamento impostata su',
    'seconds': 'secondo(i)',
    'auto_save_settings': 'Salvataggio Automatico Impostazioni',
    'auto_save_enabled': 'Salvataggio automatico attivato',
    'auto_save_disabled': 'Salvataggio automatico disattivato',
    'export_settings': 'Esporta Impostazioni',
    'import_settings': 'Importa Impostazioni',
    'delete_all_data_confirm': 'Sei sicuro di voler eliminare tutti i dati storici? Questa azione è irreversibile.',
    'deleting': 'Eliminazione...',
    'yes_delete_all_data': 'Sì, Elimina Tutti i Dati',
    'delete_permanent_warning': 'Questo eliminerà permanentemente tutte le letture del contatore memorizzate e i dati storici.',
    'current_currency': 'Attuale:',
"@
    # Add more languages here...
}

Write-Host "Translation script created. Run manually to add translations to each language section."
Write-Host "File: $filePath"

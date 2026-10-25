import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { loadLanguageSetting, setLanguageSetting } from '../i18n';
import { LANGUAGES, LANGUAGE_NAMES, type LanguageSetting } from '../i18n/languages';

export function LanguagePicker() {
  const { t } = useTranslation();
  const [setting, setSetting] = useState<LanguageSetting>('system');

  useEffect(() => {
    loadLanguageSetting().then(setSetting);
  }, []);

  const choose = (next: LanguageSetting) => {
    setSetting(next);
    void setLanguageSetting(next);
  };

  return (
    <View>
      <Text variant="labelLarge" style={styles.label}>
        {t('settings.language')}
      </Text>
      <View style={styles.row}>
        <Chip selected={setting === 'system'} onPress={() => choose('system')}>
          {t('settings.languageSystem')}
        </Chip>
        {LANGUAGES.map((code) => (
          <Chip key={code} selected={setting === code} onPress={() => choose(code)}>
            {LANGUAGE_NAMES[code]}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

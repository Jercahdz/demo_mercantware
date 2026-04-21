import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { sendRecoveryEmail } from '../../services/usuarioService';
import CustomToast from '../../components/Toast';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({ onNavigateToLogin }: ForgotPasswordScreenProps) {
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Función para mostrar toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSendRecovery = async () => {
    if (!correo) {
      showToast('Por favor ingresa tu correo electrónico', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      showToast('Por favor ingresa un correo válido', 'error');
      return;
    }

    setCargando(true);
    try {
      await sendRecoveryEmail(correo.trim());
      showToast('¡Correo enviado! Revisa tu bandeja de entrada', 'success');
      
      // Esperar 2 segundos antes de navegar
      setTimeout(() => {
        onNavigateToLogin();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error al enviar correo de recuperación:', error);
      if (error.message === 'Usuario no encontrado') {
        showToast('No existe una cuenta con ese correo electrónico', 'error');
      } else {
        showToast('No se pudo enviar el correo de recuperación', 'error');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Toast Component */}
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="key" size={36} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo y te enviaremos instrucciones para recuperar tu contraseña
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Input Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  placeholder="correo@ejemplo.com"
                  value={correo}
                  onChangeText={setCorreo}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={styles.inputHint}>
                Te enviaremos un enlace para restablecer tu contraseña
              </Text>
            </View>

            {/* Botón Enviar */}
            <TouchableOpacity
              onPress={handleSendRecovery}
              disabled={cargando}
              style={[styles.sendButton, cargando && styles.sendButtonDisabled]}
            >
              {cargando ? (
                <View style={styles.buttonContent}>
                  <Feather name="loader" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Enviando correo...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Enviar correo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Link volver al login */}
            <TouchableOpacity onPress={onNavigateToLogin} style={styles.backBox}>
              <Feather name="arrow-left" size={20} color="#3b82f6" />
              <Text style={styles.backText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Feather name="info" size={18} color="#3b82f6" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>¿No recibes el correo?</Text>
              <Text style={styles.infoText}>
                Revisa tu carpeta de spam o correo no deseado. El enlace expira en 24 horas.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Si tienes problemas, contacta a mercantwareapp@gmail.com
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    marginLeft: 4,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  backBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  backText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 16,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});
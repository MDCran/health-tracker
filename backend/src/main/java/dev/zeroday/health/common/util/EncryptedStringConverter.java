package dev.zeroday.health.common.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

@Converter
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static EncryptionService encryptionService;

    public EncryptedStringConverter(EncryptionService service) {
        EncryptedStringConverter.encryptionService = service;
    }

    public EncryptedStringConverter() {
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || encryptionService == null) return attribute;
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || encryptionService == null) return dbData;
        return encryptionService.decrypt(dbData);
    }
}

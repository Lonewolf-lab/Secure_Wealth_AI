package com.securewealth.service.security;

import com.securewealth.model.TrustedDevice;
import com.securewealth.repository.TrustedDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceTrustService {

    private final TrustedDeviceRepository trustedDeviceRepository;

    @Transactional
    public boolean isNewDevice(Long userId, String deviceId) {
        if (deviceId == null || deviceId.isBlank()) return true;

        Optional<TrustedDevice> deviceOpt = trustedDeviceRepository.findByUserIdAndDeviceId(userId, deviceId);
        
        if (deviceOpt.isEmpty() || !deviceOpt.get().isTrusted()) {
            return true;
        }

        TrustedDevice device = deviceOpt.get();
        device.setLastSeen(LocalDateTime.now());
        trustedDeviceRepository.save(device);
        return false;
    }
}

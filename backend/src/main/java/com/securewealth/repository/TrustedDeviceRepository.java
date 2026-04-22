package com.securewealth.repository;

import com.securewealth.model.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {
    List<TrustedDevice> findByUserId(Long userId);
    Optional<TrustedDevice> findByUserIdAndDeviceId(Long userId, String deviceId);
}

package com.securewealth.service;

import com.securewealth.dto.request.AddAssetRequest;
import com.securewealth.model.Asset;
import com.securewealth.model.Portfolio;
import com.securewealth.model.enums.AssetType;
import com.securewealth.repository.AssetRepository;
import com.securewealth.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetService {

    private final AssetRepository assetRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioService portfolioService;

    public List<Asset> getAssets(Long userId) {
        return assetRepository.findByUserId(userId);
    }

    @Transactional
    public Asset addAsset(Long userId, AddAssetRequest request) {
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElseThrow();

        Asset asset = Asset.builder()
                .userId(userId)
                .portfolio(portfolio)
                .name(request.getName())
                .type(AssetType.valueOf(request.getType().toUpperCase()))
                .currentValue(request.getCurrentValue())
                .purchaseValue(request.getPurchaseValue())
                .purchaseDate(request.getPurchaseDate())
                .notes(request.getNotes())
                .build();

        asset = assetRepository.save(asset);
        portfolioService.recalculateTotalValue(portfolio);
        return asset;
    }
}

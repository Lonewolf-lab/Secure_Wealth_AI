package com.securewealth.controller;

import com.securewealth.dto.request.AddAssetRequest;
import com.securewealth.model.Asset;
import com.securewealth.repository.AssetRepository;
import com.securewealth.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@Tag(name = "Assets", description = "Endpoints for asset CRUD")
public class AssetController {

    private final AssetService assetService;
    private final AssetRepository assetRepository;

    @Operation(summary = "Get all assets")
    @GetMapping
    public ResponseEntity<List<Asset>> getAssets(@RequestAttribute("X-User-Id") Long userId) {
        return ResponseEntity.ok(assetService.getAssets(userId));
    }

    @Operation(summary = "Add new asset")
    @PostMapping
    public ResponseEntity<Asset> addAsset(@RequestAttribute("X-User-Id") Long userId,
                                          @RequestBody AddAssetRequest request) {
        return ResponseEntity.ok(assetService.addAsset(userId, request));
    }

    @Operation(summary = "Delete an asset")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@RequestAttribute("X-User-Id") Long userId,
                                            @PathVariable Long id) {
        Asset asset = assetRepository.findById(id).orElseThrow();
        if (!asset.getUserId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        assetRepository.delete(asset);
        return ResponseEntity.ok().build();
    }
}

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `rol` ENUM('LOCATARIO', 'OPERADOR', 'ADMIN') NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Usuario_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Locatario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NOT NULL,
    `ruc` VARCHAR(191) NOT NULL,
    `responsableLogistica` VARCHAR(191) NULL,
    `telefonoContacto` VARCHAR(191) NULL,
    `correoElectronico` VARCHAR(191) NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    UNIQUE INDEX `Locatario_ruc_key`(`ruc`),
    UNIQUE INDEX `Locatario_correoElectronico_key`(`correoElectronico`),
    UNIQUE INDEX `Locatario_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proveedor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `ruc` VARCHAR(191) NULL,

    UNIQUE INDEX `Proveedor_ruc_key`(`ruc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProveedorPorLocatario` (
    `proveedorId` INTEGER NOT NULL,
    `locatarioId` INTEGER NOT NULL,

    PRIMARY KEY (`proveedorId`, `locatarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `proveedorId` INTEGER NULL,
    `locatarioId` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fechaCita` DATETIME(3) NOT NULL,
    `aceptoCondiciones` BOOLEAN NOT NULL,
    `estado` ENUM('PENDIENTE', 'LLEGO', 'DESCARGANDO', 'FINALIZADO', 'RETIRADO') NOT NULL DEFAULT 'PENDIENTE',
    `requiereConfirmacion` BOOLEAN NOT NULL DEFAULT false,
    `placaVehiculo` VARCHAR(191) NULL,
    `nombreChofer` VARCHAR(191) NULL,
    `dniChofer` VARCHAR(191) NULL,
    `acompanantesJson` JSON NULL,
    `horaIngreso` DATETIME(3) NULL,
    `horaDescarga` DATETIME(3) NULL,
    `horaFinaliza` DATETIME(3) NULL,
    `horaSalida` DATETIME(3) NULL,
    `usuarioId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_cita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `citaId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `estadoAnterior` ENUM('PENDIENTE', 'LLEGO', 'DESCARGANDO', 'FINALIZADO', 'RETIRADO') NULL,
    `estadoNuevo` ENUM('PENDIENTE', 'LLEGO', 'DESCARGANDO', 'FINALIZADO', 'RETIRADO') NOT NULL,
    `fechaCambio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacion` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Incidente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `citaId` INTEGER NOT NULL,
    `creadoPor` INTEGER NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `what` VARCHAR(191) NOT NULL,
    `why` VARCHAR(191) NOT NULL,
    `where` VARCHAR(191) NOT NULL,
    `who` VARCHAR(191) NOT NULL,
    `how` VARCHAR(191) NOT NULL,
    `howMuch` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Archivo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `incidenteId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Locatario` ADD CONSTRAINT `Locatario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProveedorPorLocatario` ADD CONSTRAINT `ProveedorPorLocatario_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProveedorPorLocatario` ADD CONSTRAINT `ProveedorPorLocatario_locatarioId_fkey` FOREIGN KEY (`locatarioId`) REFERENCES `Locatario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_locatarioId_fkey` FOREIGN KEY (`locatarioId`) REFERENCES `Locatario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_cita` ADD CONSTRAINT `historial_cita_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `Cita`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_cita` ADD CONSTRAINT `historial_cita_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidente` ADD CONSTRAINT `Incidente_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `Cita`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidente` ADD CONSTRAINT `Incidente_creadoPor_fkey` FOREIGN KEY (`creadoPor`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archivo` ADD CONSTRAINT `Archivo_incidenteId_fkey` FOREIGN KEY (`incidenteId`) REFERENCES `Incidente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

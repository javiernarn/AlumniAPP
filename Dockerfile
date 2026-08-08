FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    zip unzip git libzip-dev

RUN docker-php-ext-install pdo pdo_mysql zip

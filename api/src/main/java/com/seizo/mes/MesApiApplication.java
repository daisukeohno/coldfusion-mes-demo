package com.seizo.mes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** SEIZO-MES REST API の起動クラス。 */
@SpringBootApplication
public class MesApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MesApiApplication.class, args);
    }
}

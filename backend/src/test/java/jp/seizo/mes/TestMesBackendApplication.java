package jp.seizo.mes;

import org.springframework.boot.SpringApplication;

public class TestMesBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(MesBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

package jp.seizo.mes;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

/**
 * docker-compose と同じ MySQL 8.0 に、既存の db/01_schema.sql と db/02_seed.sql を投入したコンテナ。
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	MySQLContainer mysqlContainer() {
		return new MySQLContainer(DockerImageName.parse("mysql:8.0")).withDatabaseName("mesdb")
			.withUsername("mesuser")
			.withPassword("mespass")
			.withEnv("TZ", "Asia/Tokyo")
			.withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_general_ci")
			.withCopyFileToContainer(MountableFile.forHostPath("../db/01_schema.sql"),
					"/docker-entrypoint-initdb.d/01_schema.sql")
			.withCopyFileToContainer(MountableFile.forHostPath("../db/02_seed.sql"),
					"/docker-entrypoint-initdb.d/02_seed.sql");
	}

}

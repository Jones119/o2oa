package com.x.base.core.project.jaxrs.cache;

import jakarta.servlet.ServletContext;

import com.x.base.core.project.cache.CacheManager;
import com.x.base.core.project.gson.GsonRecord;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

import io.swagger.v3.oas.annotations.media.Schema;

class ActionDetail extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionDetail.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, ServletContext servletContext) throws Exception {
		LOGGER.debug("execute:{}.", effectivePerson::getDistinguishedName);
		ActionResult<Wo> result = new ActionResult<>();
		result.setData(new Wo(CacheManager.detail()));
		return result;
	}

	@Schema(name = "com.x.base.core.project.jaxrs.cache.ActionDetail$Wo")
	public record Wo(@Schema(description = "字符串值.") String value) implements GsonRecord {

		public Wo {
		}

		public Wo() {
			this(null);
		}
	}

}
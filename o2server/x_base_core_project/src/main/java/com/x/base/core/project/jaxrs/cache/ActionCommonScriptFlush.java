package com.x.base.core.project.jaxrs.cache;

import com.x.base.core.project.config.Config;
import com.x.base.core.project.gson.GsonRecord;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.scripting.GraalvmScriptingFactory;

class ActionCommonScriptFlush extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionCommonScriptFlush.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson) {
		LOGGER.debug("execute:{}.", effectivePerson::getDistinguishedName);
		ActionResult<Wo> result = new ActionResult<>();
		Config.flush();
		GraalvmScriptingFactory.flush();
		result.setData(new Wo(true));
		return result;
	}

	public record Wo(Boolean value) implements GsonRecord {

		public Wo {
		}

		public Wo() {
			this(null);
		}
	}

}
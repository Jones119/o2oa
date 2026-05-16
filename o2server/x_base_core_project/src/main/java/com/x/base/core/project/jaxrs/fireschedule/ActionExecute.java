package com.x.base.core.project.jaxrs.fireschedule;

import jakarta.servlet.ServletContext;
import jakarta.ws.rs.core.Context;

import com.x.base.core.project.AbstractContext;
import com.x.base.core.project.gson.GsonRecord;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.schedule.AbstractJob;

import io.swagger.v3.oas.annotations.media.Schema;

class ActionExecute extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionExecute.class);

	@SuppressWarnings("unchecked")
	ActionResult<Wo> execute(EffectivePerson effectivePerson, @Context ServletContext servletContext, String className)
			throws Exception {
		LOGGER.debug("execute:{}, className:{}.", effectivePerson::getDistinguishedName, () -> className);
		ActionResult<Wo> result = new ActionResult<>();
		AbstractContext ctx = AbstractContext.fromServletContext(servletContext);
		Class<?> clz = Thread.currentThread().getContextClassLoader().loadClass(className);
		ctx.fireScheduleOnLocal((Class<AbstractJob>) clz, 1);
		result.setData(new Wo(true));
		return result;
	}

	@Schema(name = "com.x.base.core.project.jaxrs.fireschedule.ActionExecute.Wo")
	public record Wo(@Schema(description = "布尔值.") Boolean value) implements GsonRecord {

		public Wo {
		}

		public Wo() {
			this(null);
		}
	}

}